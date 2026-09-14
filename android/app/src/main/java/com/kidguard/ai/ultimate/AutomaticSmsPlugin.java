package com.kidguard.ai.ultimate;

import android.telephony.SmsManager;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;

@CapacitorPlugin(
    name = "AutomaticSms",
    permissions = {
        @Permission(alias = "sms", strings = { android.Manifest.permission.SEND_SMS })
    }
)
public class AutomaticSmsPlugin extends Plugin {

    private static final String TAG = "AutomaticSms";

    @PluginMethod
    public void send(PluginCall call) {
        if (getPermissionState("sms") != com.getcapacitor.PermissionState.GRANTED) {
            requestPermissionForAlias("sms", call, "smsPermCallback");
            return;
        }
        sendNow(call);
    }

    @PermissionCallback
    private void smsPermCallback(PluginCall call) {
        if (getPermissionState("sms") == com.getcapacitor.PermissionState.GRANTED) {
            sendNow(call);
        } else {
            call.reject("SMS permission denied");
        }
    }

    private void sendNow(PluginCall call) {
        String to = call.getString("to");
        String body = call.getString("body");

        if (to == null || body == null) {
            call.reject("Missing to or body");
            return;
        }

        try {
            SmsManager sm = SmsManager.getDefault();
            ArrayList<String> parts = sm.divideMessage(body);
            if (parts.size() > 1) {
                sm.sendMultipartTextMessage(to, null, parts, null, null);
            } else {
                sm.sendTextMessage(to, null, body, null, null);
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "SMS send failed", e);
            call.reject("SMS failed: " + e.getMessage(), e);
        }
    }
}
