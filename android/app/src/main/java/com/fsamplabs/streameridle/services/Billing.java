package com.fsamplabs.streameridle.services;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.fsamplabs.streameridle.GameBridge;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Google Play Billing (v8). Products are created in Play Console with these ids. */
public class Billing implements PurchasesUpdatedListener {
    private static final Set<String> SUBS = new HashSet<>(Collections.singletonList("monthly_pass"));
    private static final Set<String> CONSUMABLE = new HashSet<>(Arrays.asList(
            "gems_small", "gems_medium", "gems_large", "gems_huge", "gems_mega", "piggy_bank", "passe_temporada"));

    private final Activity activity;
    private final GameBridge bridge;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final Map<String, ProductDetails> details = new HashMap<>();
    private final List<Runnable> onReady = new ArrayList<>();
    private BillingClient client;
    private boolean connected, connecting;
    private GameBridge.Reply pendingBuy;
    private String pendingProduct;
    private int retry;

    public Billing(Activity activity, GameBridge bridge) {
        this.activity = activity;
        this.bridge = bridge;
    }

    public void start() {
        client = BillingClient.newBuilder(activity)
                .setListener(this)
                .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                .build();
        connect();
    }

    private void connect() {
        if (connected || connecting || client == null) return;
        connecting = true;
        client.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult result) {
                main.post(() -> {
                    connecting = false;
                    connected = result.getResponseCode() == BillingClient.BillingResponseCode.OK;
                    if (connected) {
                        retry = 0;
                        List<Runnable> run = new ArrayList<>(onReady);
                        onReady.clear();
                        for (Runnable r : run) r.run();
                        processExisting();
                    } else {
                        scheduleRetry();
                    }
                });
            }

            @Override
            public void onBillingServiceDisconnected() {
                main.post(() -> {
                    connected = false;
                    connecting = false;
                    scheduleRetry();
                });
            }
        });
    }

    private void scheduleRetry() {
        retry = Math.min(retry + 1, 6);
        main.postDelayed(this::connect, (long) (Math.pow(2, retry) * 1000));
    }

    private void whenReady(Runnable r) {
        if (connected) r.run();
        else {
            onReady.add(r);
            connect();
        }
    }

    public void destroy() {
        if (client != null) client.endConnection();
    }

    // ------------------------------------------------------------ catalog
    public void query(JSONArray ids, GameBridge.Reply reply) {
        whenReady(() -> {
            List<QueryProductDetailsParams.Product> inapp = new ArrayList<>();
            List<QueryProductDetailsParams.Product> subs = new ArrayList<>();
            for (int i = 0; i < ids.length(); i++) {
                String id = ids.optString(i);
                String type = SUBS.contains(id) ? BillingClient.ProductType.SUBS : BillingClient.ProductType.INAPP;
                QueryProductDetailsParams.Product p = QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(type).build();
                (SUBS.contains(id) ? subs : inapp).add(p);
            }
            final int[] left = {(inapp.isEmpty() ? 0 : 1) + (subs.isEmpty() ? 0 : 1)};
            Runnable done = () -> {
                if (--left[0] > 0) return;
                JSONObject prices = new JSONObject();
                for (ProductDetails pd : details.values()) {
                    try { prices.put(pd.getProductId(), priceOf(pd)); } catch (Exception ignored) { }
                }
                JSONObject o = GameBridge.ok(true);
                try { o.put("products", prices); } catch (Exception ignored) { }
                reply.send(o);
            };
            if (!inapp.isEmpty()) queryList(inapp, done);
            if (!subs.isEmpty()) queryList(subs, done);
            if (left[0] == 0) reply.send(GameBridge.ok(true));
        });
    }

    private void queryList(List<QueryProductDetailsParams.Product> list, Runnable done) {
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder().setProductList(list).build();
        client.queryProductDetailsAsync(params, (result, detailsResult) -> main.post(() -> {
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && detailsResult != null) {
                for (ProductDetails pd : detailsResult.getProductDetailsList()) details.put(pd.getProductId(), pd);
            }
            done.run();
        }));
    }

    private static String priceOf(ProductDetails pd) {
        if (BillingClient.ProductType.SUBS.equals(pd.getProductType())) {
            List<ProductDetails.SubscriptionOfferDetails> offers = pd.getSubscriptionOfferDetails();
            if (offers != null && !offers.isEmpty()) {
                List<ProductDetails.PricingPhase> phases = offers.get(0).getPricingPhases().getPricingPhaseList();
                if (!phases.isEmpty()) return phases.get(phases.size() - 1).getFormattedPrice();
            }
            return "";
        }
        ProductDetails.OneTimePurchaseOfferDetails one = pd.getOneTimePurchaseOfferDetails();
        return one != null ? one.getFormattedPrice() : "";
    }

    // ------------------------------------------------------------ buying
    public void buy(String productId, GameBridge.Reply reply) {
        whenReady(() -> {
            ProductDetails pd = details.get(productId);
            if (pd == null) {
                // details not loaded yet: fetch then retry once
                JSONArray one = new JSONArray();
                one.put(productId);
                query(one, r -> {
                    ProductDetails again = details.get(productId);
                    if (again == null) reply.send(error("unavailable"));
                    else launch(again, reply);
                });
                return;
            }
            launch(pd, reply);
        });
    }

    private void launch(ProductDetails pd, GameBridge.Reply reply) {
        BillingFlowParams.ProductDetailsParams.Builder b = BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(pd);
        if (BillingClient.ProductType.SUBS.equals(pd.getProductType())) {
            List<ProductDetails.SubscriptionOfferDetails> offers = pd.getSubscriptionOfferDetails();
            if (offers == null || offers.isEmpty()) {
                reply.send(error("unavailable"));
                return;
            }
            b.setOfferToken(offers.get(0).getOfferToken());
        }
        BillingFlowParams flow = BillingFlowParams.newBuilder().setProductDetailsParamsList(Collections.singletonList(b.build())).build();
        pendingBuy = reply;
        pendingProduct = pd.getProductId();
        BillingResult r = client.launchBillingFlow(activity, flow);
        if (r.getResponseCode() != BillingClient.BillingResponseCode.OK) {
            pendingBuy = null;
            reply.send(error(r.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED ? "owned" : "failed"));
        }
    }

    @Override
    public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        main.post(() -> {
            int code = result.getResponseCode();
            if (code == BillingClient.BillingResponseCode.OK && purchases != null) {
                for (Purchase p : purchases) handle(p);
            } else if (pendingBuy != null) {
                pendingBuy.send(error(code == BillingClient.BillingResponseCode.USER_CANCELED ? "canceled" : "failed"));
                pendingBuy = null;
            }
        });
    }

    private void handle(Purchase p) {
        if (p.getPurchaseState() != Purchase.PurchaseState.PURCHASED) return; // PENDING: delivered later
        String token = p.getPurchaseToken();
        for (String productId : p.getProducts()) {
            if (CONSUMABLE.contains(productId)) {
                client.consumeAsync(ConsumeParams.newBuilder().setPurchaseToken(token).build(), (r, t) -> {
                    if (r.getResponseCode() == BillingClient.BillingResponseCode.OK) main.post(() -> deliver(productId, token));
                });
            } else if (!p.isAcknowledged()) {
                client.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(token).build(), r -> {
                    if (r.getResponseCode() == BillingClient.BillingResponseCode.OK) main.post(() -> deliver(productId, token));
                });
            } else {
                deliver(productId, token);
            }
        }
    }

    private void deliver(String productId, String token) {
        Analytics.log("iap_" + productId, new JSONObject());
        JSONObject o = GameBridge.ok(true);
        try {
            o.put("productId", productId);
            o.put("token", token);
        } catch (Exception ignored) { }
        if (pendingBuy != null && productId.equals(pendingProduct)) {
            pendingBuy.send(o);
            pendingBuy = null;
        } else {
            bridge.emit("purchase", o);
        }
    }

    /** Purchases finished while the app was closed (or pending ones that cleared). */
    private void processExisting() {
        client.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(), (r, list) -> main.post(() -> {
            if (r.getResponseCode() != BillingClient.BillingResponseCode.OK) return;
            for (Purchase p : list) {
                boolean consumable = false;
                for (String id : p.getProducts()) if (CONSUMABLE.contains(id)) consumable = true;
                if (consumable || !p.isAcknowledged()) handle(p);
            }
        }));
    }

    public void restore(GameBridge.Reply reply) {
        whenReady(() -> {
            JSONArray owned = new JSONArray();
            final long[] monthly = {0};
            client.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(), (r1, inapp) -> {
                for (Purchase p : inapp) if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) for (String id : p.getProducts()) if (!CONSUMABLE.contains(id)) owned.put(id);
                client.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build(), (r2, subs) -> {
                    for (Purchase p : subs) {
                        if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                            for (String id : p.getProducts()) owned.put(id);
                            monthly[0] = System.currentTimeMillis() + 36L * 3600_000L;
                            if (!p.isAcknowledged()) handle(p);
                        }
                    }
                    JSONObject o = GameBridge.ok(true);
                    try {
                        o.put("owned", owned);
                        o.put("monthlyExpiry", monthly[0]);
                    } catch (Exception ignored) { }
                    reply.send(o);
                });
            });
        });
    }

    private static JSONObject error(String code) {
        JSONObject o = GameBridge.ok(false);
        try { o.put("error", code); } catch (Exception ignored) { }
        return o;
    }
}
