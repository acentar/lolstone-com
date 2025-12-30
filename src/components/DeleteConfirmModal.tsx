import React, { useState } from 'react';
import { View, StyleSheet, Modal, Pressable } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

interface DeleteConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: string;
  loading?: boolean;
}

export default function DeleteConfirmModal({
  visible,
  onClose,
  onConfirm,
  itemName,
  itemType,
  loading = false,
}: DeleteConfirmModalProps) {
  const [confirmText, setConfirmText] = useState('');

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  const handleConfirm = () => {
    if (confirmText === 'DELETE') {
      onConfirm();
      setConfirmText('');
    }
  };

  const isConfirmEnabled = confirmText === 'DELETE';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#1e1e2e', '#12121a']}
            style={styles.modalContent}
          >
            {/* Warning Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.warningIcon}>⚠️</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>Delete {itemType}</Text>

            {/* Item Name */}
            <View style={styles.itemNameBox}>
              <Text style={styles.itemName}>{itemName}</Text>
            </View>

            {/* Warning Text */}
            <Text style={styles.warningText}>
              This action cannot be undone. This will permanently delete the {itemType.toLowerCase()} and all associated data.
            </Text>

            {/* Confirmation Input */}
            <Text style={styles.confirmLabel}>
              Type <Text style={styles.deleteWord}>DELETE</Text> to confirm:
            </Text>
            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              mode="outlined"
              style={styles.confirmInput}
              placeholder="Type DELETE"
              autoCapitalize="characters"
              outlineColor="#374151"
              activeOutlineColor="#ef4444"
            />

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <Button 
                mode="outlined" 
                onPress={handleClose}
                style={styles.cancelButton}
                textColor="#94a3b8"
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={handleConfirm}
                disabled={!isConfirmEnabled || loading}
                loading={loading}
                style={[
                  styles.deleteButton,
                  !isConfirmEnabled && styles.deleteButtonDisabled
                ]}
                buttonColor="#dc2626"
              >
                Delete
              </Button>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  modalContent: {
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  warningIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 16,
  },
  itemNameBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fca5a5',
    textAlign: 'center',
  },
  warningText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  deleteWord: {
    color: '#ef4444',
    fontWeight: '700',
  },
  confirmInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderColor: '#374151',
  },
  deleteButton: {
    flex: 1,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
});

