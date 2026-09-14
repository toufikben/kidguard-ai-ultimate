package com.kidguard.ai.ultimate;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SmtpEmailPlugin.class);
        registerPlugin(AutomaticSmsPlugin.class);
        registerPlugin(HeartbeatForegroundPlugin.class);
        registerPlugin(BleHeartRatePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
