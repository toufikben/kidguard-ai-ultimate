package com.kidguard.ai.ultimate;

import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Properties;
import javax.mail.Authenticator;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

@CapacitorPlugin(name = "SmtpEmail")
public class SmtpEmailPlugin extends Plugin {

    private static final String TAG = "SmtpEmail";

    @PluginMethod
    public void send(PluginCall call) {
        String host = call.getString("host", "smtp.gmail.com");
        int port = call.getInt("port", 587);
        String user = call.getString("user");
        String password = call.getString("appPassword");
        String to = call.getString("to");
        String subject = call.getString("subject", "KidGuard Alert");
        String body = call.getString("body", "");
        Boolean html = call.getBoolean("html", false);

        if (user == null || password == null || to == null) {
            call.reject("Missing user, appPassword, or to");
            return;
        }

        new Thread(() -> {
            try {
                Properties props = new Properties();
                props.put("mail.smtp.auth", "true");
                props.put("mail.smtp.starttls.enable", "true");
                props.put("mail.smtp.host", host);
                props.put("mail.smtp.port", String.valueOf(port));
                props.put("mail.smtp.ssl.trust", host);
                props.put("mail.smtp.connectiontimeout", "15000");
                props.put("mail.smtp.timeout", "15000");

                Session session = Session.getInstance(props, new Authenticator() {
                    @Override
                    protected PasswordAuthentication getPasswordAuthentication() {
                        return new PasswordAuthentication(user, password);
                    }
                });

                MimeMessage msg = new MimeMessage(session);
                msg.setFrom(new InternetAddress(user));
                msg.setRecipients(Message.RecipientType.TO, InternetAddress.parse(to));
                msg.setSubject(subject, "UTF-8");
                if (Boolean.TRUE.equals(html)) {
                    msg.setContent(body, "text/html; charset=UTF-8");
                } else {
                    msg.setText(body, "UTF-8");
                }

                Transport.send(msg);

                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } catch (Exception e) {
                Log.e(TAG, "Send failed", e);
                call.reject("SMTP send failed: " + e.getMessage(), e);
            }
        }).start();
    }
}
