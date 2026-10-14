package com.fsamplabs.streameridle.services;

import android.app.Activity;
import android.os.CancellationSignal;

import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialException;

import com.fsamplabs.streameridle.GameBridge;
import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.AuthCredential;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.GoogleAuthProvider;
import com.google.firebase.firestore.FieldValue;
import com.google.firebase.firestore.FirebaseFirestore;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

/**
 * Cloud save: Google sign-in (Credential Manager) -> Firebase Auth -> Firestore
 * document saves/{uid}. Requires google-services.json + Google sign-in enabled
 * in the Firebase console (see SETUP.md).
 */
public class Cloud {
    private final Activity activity;
    private final Executor executor = Executors.newSingleThreadExecutor();

    public Cloud(Activity activity) {
        this.activity = activity;
    }

    private boolean available() {
        try {
            return !FirebaseApp.getApps(activity).isEmpty()
                    && activity.getResources().getIdentifier("default_web_client_id", "string", activity.getPackageName()) != 0;
        } catch (Throwable t) {
            return false;
        }
    }

    private FirebaseUser user() {
        return available() ? FirebaseAuth.getInstance().getCurrentUser() : null;
    }

    public JSONObject status() {
        JSONObject o = new JSONObject();
        try {
            boolean av = available();
            o.put("available", av);
            FirebaseUser u = av ? user() : null;
            o.put("signedIn", u != null && !u.isAnonymous());
            if (u != null) o.put("name", u.getDisplayName() != null ? u.getDisplayName() : u.getEmail());
        } catch (Exception ignored) { }
        return o;
    }

    public void signIn(GameBridge.Reply reply) {
        if (!available()) {
            reply.send(GameBridge.ok(false));
            return;
        }
        int resId = activity.getResources().getIdentifier("default_web_client_id", "string", activity.getPackageName());
        GetGoogleIdOption option = new GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(false)
                .setServerClientId(activity.getString(resId))
                .setAutoSelectEnabled(false)
                .build();
        GetCredentialRequest request = new GetCredentialRequest.Builder().addCredentialOption(option).build();
        CredentialManager cm = CredentialManager.create(activity);
        cm.getCredentialAsync(activity, request, new CancellationSignal(), executor,
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse response) {
                        Credential c = response.getCredential();
                        if (c instanceof CustomCredential && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(c.getType())) {
                            try {
                                GoogleIdTokenCredential g = GoogleIdTokenCredential.createFrom(c.getData());
                                AuthCredential ac = GoogleAuthProvider.getCredential(g.getIdToken(), null);
                                activity.runOnUiThread(() -> FirebaseAuth.getInstance().signInWithCredential(ac)
                                        .addOnCompleteListener(task -> reply.send(GameBridge.ok(task.isSuccessful()))));
                            } catch (Exception e) {
                                reply.send(GameBridge.ok(false));
                            }
                        } else {
                            reply.send(GameBridge.ok(false));
                        }
                    }

                    @Override
                    public void onError(GetCredentialException e) {
                        reply.send(GameBridge.ok(false));
                    }
                });
    }

    public void save(String json, GameBridge.Reply reply) {
        FirebaseUser u = user();
        if (u == null || u.isAnonymous()) {
            reply.send(GameBridge.ok(false));
            return;
        }
        Map<String, Object> doc = new HashMap<>();
        doc.put("data", json);
        doc.put("v", 1);
        doc.put("updatedAt", FieldValue.serverTimestamp());
        FirebaseFirestore.getInstance().collection("saves").document(u.getUid()).set(doc)
                .addOnCompleteListener(task -> reply.send(GameBridge.ok(task.isSuccessful())));
    }

    public void load(GameBridge.Reply reply) {
        FirebaseUser u = user();
        if (u == null || u.isAnonymous()) {
            reply.send(GameBridge.ok(false));
            return;
        }
        FirebaseFirestore.getInstance().collection("saves").document(u.getUid()).get()
                .addOnCompleteListener(task -> {
                    JSONObject o = GameBridge.ok(task.isSuccessful());
                    try {
                        if (task.isSuccessful() && task.getResult() != null && task.getResult().exists()) {
                            o.put("data", task.getResult().getString("data"));
                        }
                    } catch (Exception ignored) { }
                    reply.send(o);
                });
    }
}
