import React, { useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';

export default function TaskModalSheet() {
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['25%', '50%'], []);

  const openSheet = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Button title="Ajouter une tâche" onPress={openSheet} />

      <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints}>
        <View style={styles.content}>
          <Text>Contenu pour la nouvelle tâche ici</Text>
          {/* Ajoute ton formulaire ici */}
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
});
