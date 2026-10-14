package com.fsamplabs.streameridle;

import android.content.Context;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** Atomic save file with a rolling backup, so a crash mid-write never loses progress. */
final class SaveStore {
    private final File main, bak, tmp;

    SaveStore(Context ctx) {
        File dir = ctx.getFilesDir();
        main = new File(dir, "save.json");
        bak = new File(dir, "save.bak.json");
        tmp = new File(dir, "save.tmp");
    }

    synchronized String load() {
        String s = read(main);
        if (s == null || s.isEmpty()) s = read(bak);
        return s;
    }

    synchronized void write(String json) {
        if (json == null || json.length() < 10) return;
        try (OutputStream out = new FileOutputStream(tmp)) {
            out.write(json.getBytes(StandardCharsets.UTF_8));
            out.flush();
            ((FileOutputStream) out).getFD().sync();
        } catch (IOException e) {
            return;
        }
        if (main.exists()) {
            //noinspection ResultOfMethodCallIgnored
            bak.delete();
            //noinspection ResultOfMethodCallIgnored
            main.renameTo(bak);
        }
        //noinspection ResultOfMethodCallIgnored
        tmp.renameTo(main);
    }

    private static String read(File f) {
        if (!f.exists()) return null;
        try (InputStream in = new FileInputStream(f)) {
            byte[] buf = new byte[(int) f.length()];
            int off = 0;
            while (off < buf.length) {
                int n = in.read(buf, off, buf.length - off);
                if (n < 0) break;
                off += n;
            }
            return new String(buf, 0, off, StandardCharsets.UTF_8);
        } catch (IOException e) {
            return null;
        }
    }
}
