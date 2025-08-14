// components/BulkSearchInput.jsx
import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
  Platform,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { getPrimaryTextColor, HEXA } from "../lib/colors";
import Icon from "react-native-vector-icons/Ionicons";
import { useSearch } from "../contexts/SearchContext";

let idCounter = 1;

export default function BulkSearchInput({
  maxFields = 10,
  onSubmit = (arr) => console.log("submit", arr),
  placeholder = "Paste CSV or type a search and press Enter...",
  secondaryPlaceHolder = "Add Search Term...",
}) {
  const { theme, accentKey, accentColors } = useTheme();
  const { submitSearch, submitBulk } = useSearch(); // get functions from context

  // fields: array of { id, value }
  const [fields, setFields] = useState(() => [{ id: idCounter++, value: "" }]);
  const [focused, setFocused] = useState(false);

  const refs = useRef({}); // map id -> input ref

  // Helpers
  const focusField = (id) => {
    const r = refs.current[id];
    if (r && typeof r.focus === "function") r.focus();
  };

  const addField = useCallback(
    (value = "", focus = true) => {
      if (fields.length >= maxFields) return null;
      const id = idCounter++;
      setFields((prev) => {
        const next = [...prev, { id, value }];
        return next;
      });
      // focus after next render
      if (focus) {
        setTimeout(() => focusField(id), 50);
      }
      return id;
    },
    [fields.length, maxFields]
  );

  const removeField = useCallback((id) => {
    setFields((prev) => {
      // ensure at least one field remains
      const next = prev.filter((f) => f.id !== id);
      return next.length ? next : [{ id: idCounter++, value: "" }];
    });
  }, []);

  const updateField = useCallback(
    (id, value) => {
      // Detect CSV/newline paste and split
      if (
        typeof value === "string" &&
        (value.includes(",") || value.includes("\n"))
      ) {
        const parts = value
          .split(/[\n,]+/)
          .map((p) => p.trim())
          .filter(Boolean);
        if (parts.length <= 1) {
          // normal update
          setFields((prev) =>
            prev.map((f) => (f.id === id ? { ...f, value } : f))
          );
          return;
        }

        // Replace current field with first part and append others until max
        setFields((prev) => {
          // replace current
          const replaced = prev.map((f) =>
            f.id === id ? { ...f, value: parts[0] } : f
          );
          // append the rest, respecting maxFields
          const remainingSlots = maxFields - replaced.length;
          const toAppend = parts
            .slice(1, 1 + remainingSlots)
            .map(() => ({ id: idCounter++, value: "" }));
          // Now assign values to appended slots based on parts[1..]
          toAppend.forEach((slot, idx) => {
            slot.value = parts[1 + idx] || "";
          });
          return [...replaced, ...toAppend];
        });

        // focus last appended (or next available)
        setTimeout(() => {
          // find last appended id (approx)
          const all = refs.current;
          const keys = Object.keys(all);
          if (keys.length) {
            const lastKey = keys[keys.length - 1];
            const r = all[lastKey];
            if (r && typeof r.focus === "function") r.focus();
          }
        }, 80);

        return;
      }

      setFields((prev) => prev.map((f) => (f.id === id ? { ...f, value } : f)));
    },
    [maxFields]
  );

  const handleSubmit = useCallback(
    (clearBulk = false) => {
      const values = fields
        .map((f) => f.value.trim())
        .filter(Boolean)
        .slice(0, maxFields);

      if (values.length === 0) return;

      // prefer context functions if available
      if (values.length === 1) {
        // single search
        if (typeof submitSearch === "function") {
          submitSearch(values[0]);
        } else if (typeof onSubmit === "function") {
          onSubmit(values);
        }
      } else {
        // bulk search
        if (typeof submitBulk === "function") {
          submitBulk(values);
        } else if (typeof onSubmit === "function") {
          onSubmit(values);
        }
      }
      Keyboard.dismiss();
      if (clearBulk) {
        setFields((prev) => {
          // ensure at least one field remains
          const next = prev.filter((f, i) => i === 0);
          return next.length ? next : [{ id: idCounter++, value: "" }];
        });
      }
    },
    [fields, maxFields, onSubmit]
  );

  const handleFieldSubmitEditing = useCallback(
    (index) => {
      // if last field and not over limit, add new one
      if (index === fields.length - 1 && fields.length < maxFields) {
        addField("", true);
      } else {
        // focus next field if exists
        const next = fields[index + 1];
        if (next) focusField(next.id);
      }
    },
    [fields, addField, maxFields]
  );

  const accent = accentColors?.[accentKey]?.base ?? theme.accent;

  return (
    <View
      style={[
        styles.wrapper,
        {
          width: "100%",
          backgroundColor: fields.length > 1 && theme.backgroundSecondary,
          border: `1px solid ${fields.length > 1 && theme.textSecondary}`,
          padding: fields.length > 1 ? 10 : 0,
        },
      ]}
    >
      {/* Each field is rendered in order */}
      {fields.map((f, idx) => (
        <View style={[]}>
          <View
            key={f.id}
            style={[
              styles.row,
              {
                borderColor: HEXA(theme.textSecondary, 0.15),
                backgroundColor: HEXA(theme.background, 1),
              },
              idx === 0 &&
                focused && {
                  borderColor: accentColors[accentKey].dark, // your gold color
                  boxShadow: `0 0 6px ${accentColors[accentKey].dark}`, // glow effect
                  outlineWidth: 0,
                },
              idx === 1 && { position: "relative" },
            ]}
          >
            {idx === 0 && (
              <View style={styles.iconBox}>
                {/* <Text style={{ color: theme.text, fontSize: 16 }}>🔍</Text> */}
                <Icon size={25} color={theme.accent} name="search" />
              </View>
            )}

            <TextInput
              ref={(r) => (refs.current[f.id] = r)}
              value={f.value}
              placeholder={idx === 0 ? placeholder : secondaryPlaceHolder}
              placeholderTextColor={theme.textSecondary}
              onChangeText={(text) => updateField(f.id, text)}
              onSubmitEditing={() =>
                idx === 0 ? handleSubmit(true) : handleFieldSubmitEditing(idx)
              }
              returnKeyType="next"
              blurOnSubmit={idx === 0}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: HEXA(theme.background, 1),
                },
              ]}
            />

            {/* Add / Remove icons */}
            {idx === 0 ? (
              <Pressable
                style={({ pressed }) => [
                  styles.addButton,
                  {
                    backgroundColor: pressed
                      ? HEXA(accent, 0.12)
                      : "transparent",
                    borderColor: accent,
                  },
                ]}
                onPress={() => addField("", true)}
                accessibilityLabel="Add search field"
              >
                <Text style={[styles.addText, { color: accent }]}>＋</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.removeButton}
                onPress={() => removeField(f.id)}
                accessibilityLabel="Remove this search"
              >
                <Text
                  style={[styles.removeText, { color: theme.textSecondary }]}
                >
                  ×
                </Text>
              </Pressable>
            )}
          </View>
          {fields.length > 1 && idx === fields.length - 1 && (
            <View
              style={[
                styles.submitRow,
                // { position: "absolute", top: `calc(${idx * 70}px + 70px)` },
              ]}
            >
              <Pressable
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.submitButton,
                  {
                    backgroundColor: pressed ? HEXA(accent, 0.85) : accent,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.submitText,
                    { color: getPrimaryTextColor(accent) },
                  ]}
                >
                  Search All (
                  {fields.map((f) => f.value.trim()).filter(Boolean).length})
                </Text>
              </Pressable>

              <Text style={[styles.hint, { color: theme.textSecondary }]}>
                Paste comma/newline separated values to split automatically (max{" "}
                {maxFields})
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "stretch",
    borderRadius: 10,
    paddingTop: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === "web" ? 6 : 4,
    marginBottom: 8,
  },
  remainder: {
    position: "absolute",
    top: "50%",
    width: "100%",
    zIndex: 10,
  },
  iconBox: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    width: "100%",
    paddingHorizontal: 20,
    // paddingVertical: 10,
    bordorWidth: 0,
    boxShadow: "none",
    outlineWidth: 0, // remove outline
    boxShadow: "none",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginLeft: 8,
    marginRight: 15,
  },
  addText: {
    fontSize: 18,
    lineHeight: 18,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    marginRight: 15,
  },
  removeText: {
    fontSize: 20,
    lineHeight: 20,
  },
  submitRow: {
    marginTop: 12,
    display: "flex",
    alignItems: "flex-start",
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 160,
  },
  submitText: {
    fontWeight: "700",
    fontSize: 14,
  },
  hint: {
    marginTop: 8,
    fontSize: 13,
  },
});
