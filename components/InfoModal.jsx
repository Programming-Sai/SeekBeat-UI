import React from "react";
import {
  Modal,
  View,
  ScrollView,
  Text,
  Pressable,
  Linking,
} from "react-native";
import { HEXA } from "../lib/colors";

export default function InfoModal({ visible, onClose, theme }) {
  const openReleases = () =>
    Linking.openURL("https://github.com/Programming-Sai/SeekBeat/releases");

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: HEXA(theme.text, 0.7),
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: theme.background,
            borderRadius: 12,
            width: "90%",
            maxHeight: "85%",
            padding: 20,
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 22, color: theme.text, marginBottom: 16 }}>
              Seekbeat Companion Backend
            </Text>

            <Text style={{ color: theme.textSecondary, marginBottom: 12 }}>
              Seekbeat relies on a companion backend for search, streaming, and
              downloads. The default hosted URL supports search only. To unlock
              full functionality, run the backend yourself.
            </Text>

            <Text style={{ color: theme.text, fontWeight: "600" }}>
              Quick Setup
            </Text>
            <Text style={{ color: theme.textSecondary, marginBottom: 12 }}>
              1. Download the latest Windows .exe from{" "}
              <Text
                style={{ color: theme.accent, fontWeight: "bold" }}
                onPress={openReleases}
              >
                Github Releases
              </Text>
              .{"\n"}2. Double-click the .exe to start the server.
              {"\n"}3. Copy the URL shown in the console (e.g.
              http://192.168.x.x:8000).
              {"\n"}4. Paste it into Settings → Backend URL → Test.
            </Text>

            <Text style={{ color: theme.text, fontWeight: "600" }}>
              Mobile Access
            </Text>
            <Text style={{ color: theme.textSecondary, marginBottom: 12 }}>
              • Run the backend on a laptop/desktop.
              {"\n"}• On the same Wi-Fi, use the http://192.168.x.x:8000 IP.
              {"\n"}• For remote access, install ngrok, run `ngrok http 8000`,
              and use the generated URL.
            </Text>

            <Text style={{ color: theme.textSecondary }}>
              Keep the console open while using Seekbeat. Allow firewall access
              if prompted.
            </Text>
          </ScrollView>

          <Pressable
            style={{
              marginTop: 20,
              alignSelf: "center",
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: theme.accent,
              borderRadius: 8,
            }}
            onPress={onClose}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
