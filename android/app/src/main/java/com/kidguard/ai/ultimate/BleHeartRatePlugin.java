package com.kidguard.ai.ultimate;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.UUID;

@CapacitorPlugin(
    name = "BleHeartRate",
    permissions = {
        @Permission(alias = "ble", strings = {
            android.Manifest.permission.BLUETOOTH_SCAN,
            android.Manifest.permission.BLUETOOTH_CONNECT,
            android.Manifest.permission.ACCESS_FINE_LOCATION
        })
    }
)
public class BleHeartRatePlugin extends Plugin {

    private static final String TAG = "BleHeartRate";
    private static final UUID HR_SERVICE = UUID.fromString("0000180d-0000-1000-8000-00805f9b34fb");
    private static final UUID HR_MEASUREMENT = UUID.fromString("00002a37-0000-1000-8000-00805f9b34fb");

    private BluetoothGatt gatt;
    private BluetoothLeScanner scanner;

    @PluginMethod
    public void connect(PluginCall call) {
        if (getPermissionState("ble") != com.getcapacitor.PermissionState.GRANTED) {
            requestPermissionForAlias("ble", call, "permCallback");
            return;
        }
        startScan(call);
    }

    @PermissionCallback
    private void permCallback(PluginCall call) {
        if (getPermissionState("ble") == com.getcapacitor.PermissionState.GRANTED) {
            startScan(call);
        } else {
            call.reject("BLE permission denied");
        }
    }

    private void startScan(PluginCall call) {
        BluetoothManager bm = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        BluetoothAdapter adapter = bm != null ? bm.getAdapter() : null;
        if (adapter == null || !adapter.isEnabled()) {
            call.reject("Bluetooth off");
            return;
        }

        scanner = adapter.getBluetoothLeScanner();
        if (scanner == null) {
            call.reject("Scanner unavailable");
            return;
        }

        ScanSettings settings = new ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .build();

        ScanCallback cb = new ScanCallback() {
            @Override
            public void onScanResult(int callbackType, ScanResult result) {
                BluetoothDevice device = result.getDevice();
                if (device == null) return;

                scanner.stopScan(this);
                if (ActivityCompat.checkSelfPermission(getContext(),
                        android.Manifest.permission.BLUETOOTH_CONNECT)
                        != PackageManager.PERMISSION_GRANTED) return;

                gatt = device.connectGatt(getContext(), false, new BluetoothGattCallback() {
                    @Override
                    public void onConnectionStateChange(BluetoothGatt g, int status, int newState) {
                        if (newState == android.bluetooth.BluetoothProfile.STATE_CONNECTED) {
                            if (ActivityCompat.checkSelfPermission(getContext(),
                                    android.Manifest.permission.BLUETOOTH_CONNECT)
                                    != PackageManager.PERMISSION_GRANTED) return;
                            g.discoverServices();
                        }
                    }

                    @Override
                    public void onServicesDiscovered(BluetoothGatt g, int status) {
                        BluetoothGattService svc = g.getService(HR_SERVICE);
                        if (svc == null) return;
                        BluetoothGattCharacteristic ch = svc.getCharacteristic(HR_MEASUREMENT);
                        if (ch == null) return;
                        if (ActivityCompat.checkSelfPermission(getContext(),
                                android.Manifest.permission.BLUETOOTH_CONNECT)
                                != PackageManager.PERMISSION_GRANTED) return;
                        g.setCharacteristicNotification(ch, true);
                        g.readCharacteristic(ch);
                    }

                    @Override
                    public void onCharacteristicChanged(BluetoothGatt g,
                                                       BluetoothGattCharacteristic ch) {
                        int bpm = parseBpm(ch);
                        if (bpm > 0) {
                            JSObject data = new JSObject();
                            data.put("bpm", bpm);
                            data.put("timestamp", System.currentTimeMillis());
                            notifyListeners("heartRate", data);
                        }
                    }
                });

                JSObject ret = new JSObject();
                ret.put("connected", true);
                ret.put("deviceName", device.getName() != null ? device.getName() : "BLE HR");
                call.resolve(ret);
            }
        };

        scanner.startScan(null, settings, cb);
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            if (scanner != null) scanner.stopScan(cb);
        }, 15000);
    }

    private int parseBpm(BluetoothGattCharacteristic ch) {
        byte[] data = ch.getValue();
        if (data == null || data.length < 2) return 0;
        int flag = data[0] & 0x01;
        return flag == 0 ? (data[1] & 0xFF)
            : ((data[1] & 0xFF) | ((data[2] & 0xFF) << 8));
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        if (gatt != null) {
            gatt.close();
            gatt = null;
        }
        JSObject r = new JSObject();
        r.put("disconnected", true);
        call.resolve(r);
    }
}
