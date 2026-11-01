import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
  FlatList,
  ScrollView,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import PanoramaViewer from '../components/PanoramaViewer';
import {
  getPanoramaPointById,
  getPanoramaConnections,
  getPanoramaPointsByDestination,
  getInfoHotspotsByPoint,
  addInfoHotspot,
  updateInfoHotspot,
  deleteInfoHotspot,
  uploadImage,
  addPanoramaPoint,
  addPanoramaConnection,
  deletePanoramaConnection
} from '../services/database';
import { resolvePanorama } from '../utils/panoramaAssets';

const { width, height } = Dimensions.get('window');

// Alert.alert na may buttons ay hindi gumagana sa web, kaya may fallback.
const notify = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
};

const confirmAction = (title, message, confirmText, onConfirm) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: confirmText, style: 'destructive', onPress: onConfirm }
    ]);
  }
};

// Palitan mo ito ng tunay na check (hal. isAdmin) para admin lang ang may Edit mode.
const CAN_EDIT = true;

const PanoramaViewScreen = ({ route, navigation }) => {
  const { destinationId, destinationName, entryPointId } = route.params;

  const [currentPoint, setCurrentPoint] = useState(null);
  const [connections, setConnections] = useState([]);
  const [allPoints, setAllPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showNavigationMenu, setShowNavigationMenu] = useState(false);
  const [panoramaUri, setPanoramaUri] = useState(null);

  // Info hotspots
  const [infoHotspots, setInfoHotspots] = useState([]);
  const [selectedInfo, setSelectedInfo] = useState(null); // para sa view modal
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState(null); // { yaw, pitch }
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Pagdagdag ng 360 point at link (arrow)
  const [chooserVisible, setChooserVisible] = useState(false);
  const [pointFormVisible, setPointFormVisible] = useState(false);
  const [newPointName, setNewPointName] = useState('');
  const [newPointImageUri, setNewPointImageUri] = useState(null);
  const [linkFormVisible, setLinkFormVisible] = useState(false);
  const [linkTargetId, setLinkTargetId] = useState(null);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkBack, setLinkBack] = useState(true);

  useEffect(() => {
    loadPanoramaPoint(entryPointId);
    loadAllPoints();
  }, [entryPointId]);

  const loadAllPoints = async () => {
    try {
      const points = await getPanoramaPointsByDestination(destinationId);
      setAllPoints(points);
    } catch (error) {
      console.error('Error loading all panorama points:', error);
    }
  };

  const loadInfoHotspots = async (pointId) => {
    try {
      const list = await getInfoHotspotsByPoint(pointId);
      setInfoHotspots(list);
    } catch (error) {
      // Hindi dapat masira ang buong tour kung wala pang table
      console.error('Error loading info hotspots:', error);
      setInfoHotspots([]);
    }
  };

  const reloadConnections = async () => {
    try {
      const list = await getPanoramaConnections(currentPoint.id);
      setConnections(list);
    } catch (error) {
      console.error('Error reloading connections:', error);
    }
  };

  const loadPanoramaPoint = async (pointId) => {
    try {
      setLoading(true);
      setDraft(null);
      setFormVisible(false);
      setSelectedInfo(null);

      // Get current panorama point
      const point = await getPanoramaPointById(pointId);
      if (!point) {
        Alert.alert('Error', 'Panorama point not found');
        navigation.goBack();
        return;
      }

      setCurrentPoint(point);
      setPanoramaUri(await resolvePanorama(point.panorama_image));

      // Get connections from this point
      const pointConnections = await getPanoramaConnections(pointId);
      setConnections(pointConnections);

      await loadInfoHotspots(pointId);

      setLoading(false);
    } catch (error) {
      console.error('Error loading panorama point:', error);
      Alert.alert('Error', 'Failed to load panorama view');
      setLoading(false);
    }
  };

  const navigateToPoint = (toPointId) => {
    setShowNavigationMenu(false);
    loadPanoramaPoint(toPointId);
  };

  const handleHotspotPress = (hotspot) => {
    if (editMode) {
      // Sa edit mode, ang pindot sa pulang arrow ay pagbura (hindi paglipat)
      confirmAction(
        'Burahin ang arrow?',
        `Buburahin ang link papuntang "${hotspot.to_point_name || 'point'}".`,
        'Burahin',
        async () => {
          try {
            await deletePanoramaConnection(hotspot.id);
            await reloadConnections();
          } catch (error) {
            console.error('Error deleting connection:', error);
            notify('Error', 'Hindi nabura ang arrow.');
          }
        }
      );
      return;
    }
    navigateToPoint(hotspot.to_point_id);
  };

  const toggleMiniMap = () => {
    setShowMiniMap(!showMiniMap);
  };

  // ---------- Info hotspot handlers ----------

  const handleInfoHotspotPress = (hotspot) => {
    if (editMode) {
      openEditForm(hotspot);
    } else {
      setSelectedInfo(hotspot);
    }
  };

  // Sa iOS, hindi puwedeng sabay ang pagsara at pagbukas ng Modal
  const afterModal = (fn) => setTimeout(fn, Platform.OS === 'ios' ? 350 : 0);

  const handlePlaceHotspot = ({ yaw, pitch }) => {
    // Tap sa larawan habang edit mode -> tanungin kung Info o Link
    setDraft({ yaw, pitch });
    setChooserVisible(true);
  };

  const cancelChooser = () => {
    setChooserVisible(false);
    setDraft(null);
  };

  const chooseInfo = () => {
    setChooserVisible(false);
    setEditingId(null);
    setFormTitle('');
    setFormDescription('');
    setFormImageUrl('');
    afterModal(() => setFormVisible(true));
  };

  const chooseLink = () => {
    const others = allPoints.filter((p) => !currentPoint || p.id !== currentPoint.id);
    if (others.length === 0) {
      setChooserVisible(false);
      setDraft(null);
      notify('Walang ibang point', 'Magdagdag muna ng 360 point gamit ang "＋ 360 point".');
      return;
    }
    setChooserVisible(false);
    setLinkTargetId(null);
    setLinkLabel('');
    setLinkBack(true);
    afterModal(() => setLinkFormVisible(true));
  };

  const openEditForm = (hotspot) => {
    setDraft(null);
    setEditingId(hotspot.id);
    setFormTitle(hotspot.title || '');
    setFormDescription(hotspot.description || '');
    setFormImageUrl(hotspot.image_url || '');
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    setDraft(null);
    setEditingId(null);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 1
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setUploading(true);

      // Paliitin muna: 1600 px ang lapad (hindi ginagalaw kung mas maliit na)
      const actions = asset.width && asset.width > 1600
        ? [{ resize: { width: 1600 } }]
        : [];
      const resized = await ImageManipulator.manipulateAsync(asset.uri, actions, {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG
      });

      const url = await uploadImage(resized.uri);
      setFormImageUrl(url);
    } catch (error) {
      console.error('Error uploading image:', error);
      notify('Error', 'Hindi na-upload ang larawan: ' + (error && error.message ? error.message : ''));
    } finally {
      setUploading(false);
    }
  };

  const closeLinkForm = () => {
    setLinkFormVisible(false);
    setDraft(null);
  };

  const normalizeYaw = (y) => ((((y + 180) % 360) + 360) % 360) - 180;

  const saveLink = async () => {
    if (!linkTargetId) {
      notify('Kulang', 'Pumili ng pupuntahan.');
      return;
    }
    if (!draft || !currentPoint) return;
    try {
      setSaving(true);
      // yaw/pitch -> hotspot_x/hotspot_y (kabaligtaran ng ginagawa ng viewer)
      const toX = (yaw) => normalizeYaw(yaw) / 360 + 0.5;
      const toY = (pitch) => 0.5 - pitch / 180;

      await addPanoramaConnection({
        from_point_id: currentPoint.id,
        to_point_id: linkTargetId,
        hotspot_x: toX(draft.yaw),
        hotspot_y: toY(draft.pitch),
        label: linkLabel.trim()
      });

      if (linkBack) {
        // Arrow pabalik sa kabilang larawan, sa kabilang direksyon (burahin/ulitin kung mali ang pwesto)
        await addPanoramaConnection({
          from_point_id: linkTargetId,
          to_point_id: currentPoint.id,
          hotspot_x: toX(draft.yaw + 180),
          hotspot_y: toY(-10),
          label: 'back'
        });
      }

      await reloadConnections();
      closeLinkForm();
    } catch (error) {
      console.error('Error saving link:', error);
      notify('Error', 'Hindi na-save ang arrow.');
    } finally {
      setSaving(false);
    }
  };

  const pickPointImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
      if (result.canceled) return;
      const asset = result.assets[0];
      setUploading(true);
      // Hanggang 4096 px ang lapad para kayanin ng phone
      const actions = asset.width && asset.width > 4096
        ? [{ resize: { width: 4096 } }]
        : [];
      const resized = await ImageManipulator.manipulateAsync(asset.uri, actions, {
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG
      });
      setNewPointImageUri(resized.uri);
    } catch (error) {
      console.error('Error picking panorama:', error);
      notify('Error', 'Hindi nabasa ang larawan.');
    } finally {
      setUploading(false);
    }
  };

  const closePointForm = () => {
    setPointFormVisible(false);
    setNewPointName('');
    setNewPointImageUri(null);
  };

  const savePoint = async () => {
    if (!newPointName.trim()) {
      notify('Kulang', 'Maglagay ng pangalan.');
      return;
    }
    if (!newPointImageUri) {
      notify('Kulang', 'Pumili ng 360° na larawan.');
      return;
    }
    try {
      setSaving(true);
      await addPanoramaPoint({
        destination_id: destinationId,
        name: newPointName.trim(),
        panorama_image: newPointImageUri, // mag-a-upload ang addPanoramaPoint
        rotation: 0,
        is_entry_point: false
      });
      await loadAllPoints();
      closePointForm();
      notify(
        'Naidagdag na',
        'Para magkaroon ng arrow papunta dito: i-tap ang larawan, piliin ang Link, at piliin ang bagong point.'
      );
    } catch (error) {
      console.error('Error adding panorama point:', error);
      notify('Error', 'Hindi na-save ang 360 point.');
    } finally {
      setSaving(false);
    }
  };

  const saveHotspot = async () => {
    if (!formTitle.trim()) {
      notify('Kulang', 'Maglagay ng title.');
      return;
    }
    try {
      setSaving(true);
      const fields = {
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        image_url: formImageUrl.trim() || null
      };

      if (editingId) {
        await updateInfoHotspot(editingId, fields);
      } else if (draft) {
        await addInfoHotspot({
          panorama_point_id: currentPoint.id,
          yaw: draft.yaw,
          pitch: draft.pitch,
          ...fields
        });
      }

      await loadInfoHotspots(currentPoint.id);
      closeForm();
    } catch (error) {
      console.error('Error saving hotspot:', error);
      notify('Error', 'Hindi na-save ang hotspot.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteHotspot = () => {
    confirmAction('Burahin?', 'Buburahin ang info hotspot na ito.', 'Burahin', async () => {
      try {
        await deleteInfoHotspot(editingId);
        await loadInfoHotspots(currentPoint.id);
        closeForm();
      } catch (error) {
        console.error('Error deleting hotspot:', error);
        notify('Error', 'Hindi nabura ang hotspot.');
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading Virtual Tour...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Panorama Viewer */}
      {currentPoint && panoramaUri && (
        <PanoramaViewer
          panoramaImage={panoramaUri}
          hotspots={connections}
          initialRotation={currentPoint.rotation}
          onHotspotPress={handleHotspotPress}
          infoHotspots={infoHotspots}
          editMode={editMode}
          draft={draft}
          onInfoHotspotPress={handleInfoHotspotPress}
          onPlaceHotspot={handlePlaceHotspot}
        />
      )}

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Map</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.destinationTitle}>{destinationName}</Text>
          {currentPoint && (
            <Text style={styles.pointName}>{currentPoint.name}</Text>
          )}
        </View>
      </View>

      {/* Edit mode banner */}
      {editMode && (
        <View style={styles.editBanner}>
          <Text style={styles.editBannerText}>
            ✏️ Edit mode: i-tap ang larawan para maglagay ng Info o Link. I-tap ang ⓘ para i-edit, o ang pulang arrow para burahin
          </Text>
        </View>
      )}

      {/* Mini Map */}
      {showMiniMap && allPoints.length > 0 && (
        <View style={styles.miniMapContainer}>
          <View style={styles.miniMapHeader}>
            <Text style={styles.miniMapTitle}>Tour Map</Text>
            <TouchableOpacity onPress={toggleMiniMap}>
              <Text style={styles.miniMapClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.miniMapContent}>
            {allPoints.map((point) => (
              <TouchableOpacity
                key={point.id}
                style={[
                  styles.miniMapPoint,
                  currentPoint && currentPoint.id === point.id && styles.miniMapPointActive
                ]}
                onPress={() => navigateToPoint(point.id)}
              >
                <Text style={styles.miniMapPointText}>
                  {point.is_entry_point ? '🏠' : '📍'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Navigation Controls */}
      <View style={styles.controlsContainer}>
        {/* Show/Hide Mini Map */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleMiniMap}
        >
          <Text style={styles.controlButtonText}>
            {showMiniMap ? '🗺️ Hide Map' : '🗺️ Show Map'}
          </Text>
        </TouchableOpacity>

        {/* Navigation Menu */}
        {connections.length > 0 && (
          <TouchableOpacity
            style={[styles.controlButton, styles.navigationButton]}
            onPress={() => setShowNavigationMenu(true)}
          >
            <Text style={styles.controlButtonText}>
              🧭 Navigate ({connections.length})
            </Text>
          </TouchableOpacity>
        )}

        {/* Info Button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            navigation.navigate('DestinationDetail', { destinationId });
          }}
        >
          <Text style={styles.controlButtonText}>ℹ️ Info</Text>
        </TouchableOpacity>

        {/* Magdagdag ng bagong 360 point */}
        {CAN_EDIT && editMode && (
          <TouchableOpacity
            style={[styles.controlButton, styles.editActiveButton]}
            onPress={() => setPointFormVisible(true)}
          >
            <Text style={styles.controlButtonText}>＋ 360 point</Text>
          </TouchableOpacity>
        )}

        {/* Edit toggle */}
        {CAN_EDIT && (
          <TouchableOpacity
            style={[styles.controlButton, editMode && styles.editActiveButton]}
            onPress={() => {
              setEditMode(!editMode);
              setDraft(null);
            }}
          >
            <Text style={styles.controlButtonText}>
              {editMode ? '✔ Done' : '✏️ Edit'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Help Text */}
      <View style={styles.helpContainer}>
        <Text style={styles.helpText}>
          👆 Drag to look around • {connections.length > 0 ? 'Tap red markers to move' : 'No navigation points available'}
          {infoHotspots.length > 0 ? ' • Tap ⓘ for info' : ''}
        </Text>
      </View>

      {/* Info Hotspot Modal (yung lalabas kapag pinindot ang "i") */}
      <Modal
        visible={!!selectedInfo}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedInfo(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.infoCard}>
            <ScrollView contentContainerStyle={styles.infoCardContent}>
              {selectedInfo && !!selectedInfo.image_url && (
                <Image
                  source={{ uri: selectedInfo.image_url }}
                  style={styles.infoImage}
                  resizeMode="contain"
                />
              )}
              {selectedInfo && (
                <Text style={styles.infoTitle}>{selectedInfo.title}</Text>
              )}
              {selectedInfo && !!selectedInfo.description && (
                <Text style={styles.infoDescription}>{selectedInfo.description}</Text>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.infoClose}
              onPress={() => setSelectedInfo(null)}
            >
              <Text style={styles.infoCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pagpili: Info o Link */}
      <Modal
        visible={chooserVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelChooser}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formCard}>
            <Text style={styles.navigationMenuTitle}>Ano ang ilalagay dito?</Text>
            <TouchableOpacity
              style={[styles.formButton, styles.formSave, styles.stackedButton]}
              onPress={chooseInfo}
            >
              <Text style={styles.navigationMenuCloseText}>ⓘ Info (may modal)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formButton, styles.navigationButtonSolid, styles.stackedButton]}
              onPress={chooseLink}
            >
              <Text style={styles.navigationMenuCloseText}>➜ Link sa ibang 360</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formButton, styles.formCancel, styles.stackedButton]}
              onPress={cancelChooser}
            >
              <Text style={styles.navigationMenuCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Link form: pumili ng pupuntahan */}
      <Modal
        visible={linkFormVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeLinkForm}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.formCard}>
            <Text style={styles.navigationMenuTitle}>Link sa ibang 360</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Pupuntahan:</Text>
              {allPoints
                .filter((p) => !currentPoint || p.id !== currentPoint.id)
                .map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.targetRow,
                      linkTargetId === p.id && styles.targetRowActive
                    ]}
                    onPress={() => setLinkTargetId(p.id)}
                  >
                    <Text style={styles.targetRowText}>
                      {linkTargetId === p.id ? '● ' : '○ '}
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}

              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Label (hal. Pumasok sa loob)"
                placeholderTextColor="#999"
                value={linkLabel}
                onChangeText={setLinkLabel}
              />

              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setLinkBack(!linkBack)}
              >
                <Text style={styles.targetRowText}>
                  {linkBack ? '☑' : '☐'} Gumawa rin ng arrow pabalik
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.formButton, styles.formCancel]}
                onPress={closeLinkForm}
              >
                <Text style={styles.navigationMenuCloseText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formButton, styles.formSave]}
                onPress={saveLink}
                disabled={saving}
              >
                <Text style={styles.navigationMenuCloseText}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Magdagdag ng bagong 360 point */}
      <Modal
        visible={pointFormVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closePointForm}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.formCard}>
            <Text style={styles.navigationMenuTitle}>Bagong 360° Point</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.input}
                placeholder="Pangalan (hal. Loob ng Galleria)"
                placeholderTextColor="#999"
                value={newPointName}
                onChangeText={setNewPointName}
              />
              <TouchableOpacity
                style={styles.pickButton}
                onPress={pickPointImage}
                disabled={uploading}
              >
                <Text style={styles.controlButtonText}>
                  {uploading ? 'Inihahanda...' : '📷 Pumili ng 360° na larawan'}
                </Text>
              </TouchableOpacity>
              {!!newPointImageUri && (
                <Image
                  source={{ uri: newPointImageUri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              )}
              <Text style={styles.fieldHint}>
                Dapat 2:1 ang ratio ng larawan (halimbawa 4096 × 2048).
              </Text>
            </ScrollView>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.formButton, styles.formCancel]}
                onPress={closePointForm}
              >
                <Text style={styles.navigationMenuCloseText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formButton, styles.formSave]}
                onPress={savePoint}
                disabled={saving || uploading}
              >
                <Text style={styles.navigationMenuCloseText}>
                  {saving ? 'Nag-a-upload...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add/Edit Hotspot Form */}
      <Modal
        visible={formVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeForm}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.formCard}>
            <Text style={styles.navigationMenuTitle}>
              {editingId ? 'Edit Info Hotspot' : 'New Info Hotspot'}
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.input}
                placeholder="Title (hal. Ina ng Lahi)"
                placeholderTextColor="#999"
                value={formTitle}
                onChangeText={setFormTitle}
              />
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Description"
                placeholderTextColor="#999"
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
              />
              <TouchableOpacity
                style={styles.pickButton}
                onPress={pickImage}
                disabled={uploading}
              >
                <Text style={styles.controlButtonText}>
                  {uploading ? 'Uploading...' : '📷 Pumili ng larawan'}
                </Text>
              </TouchableOpacity>
              {!!formImageUrl && (
                <Image
                  source={{ uri: formImageUrl }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              )}
              <TextInput
                style={styles.input}
                placeholder="Image URL (optional)"
                placeholderTextColor="#999"
                value={formImageUrl}
                onChangeText={setFormImageUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </ScrollView>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.formButton, styles.formCancel]}
                onPress={closeForm}
              >
                <Text style={styles.navigationMenuCloseText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formButton, styles.formSave]}
                onPress={saveHotspot}
                disabled={saving}
              >
                <Text style={styles.navigationMenuCloseText}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
            {editingId && (
              <TouchableOpacity
                style={[styles.formButton, styles.formDelete]}
                onPress={confirmDeleteHotspot}
              >
                <Text style={styles.navigationMenuCloseText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Navigation Menu Modal */}
      <Modal
        visible={showNavigationMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNavigationMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.navigationMenuContainer}>
            <Text style={styles.navigationMenuTitle}>Choose Your Destination</Text>

            <FlatList
              data={connections}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.navigationMenuItem}
                  onPress={() => navigateToPoint(item.to_point_id)}
                >
                  <Text style={styles.navigationMenuIcon}>➜</Text>
                  <View style={styles.navigationMenuTextContainer}>
                    <Text style={styles.navigationMenuItemTitle}>
                      {item.to_point_name || 'Unnamed Point'}
                    </Text>
                    {item.label && (
                      <Text style={styles.navigationMenuItemLabel}>{item.label}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.navigationMenuClose}
              onPress={() => setShowNavigationMenu(false)}
            >
              <Text style={styles.navigationMenuCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#fff'
  },
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    zIndex: 10
  },
  backButton: {
    marginBottom: 10
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  titleContainer: {
    alignItems: 'center'
  },
  destinationTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  pointName: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 3
  },
  editBanner: {
    position: 'absolute',
    top: 135,
    left: 15,
    right: 15,
    backgroundColor: 'rgba(46, 125, 50, 0.92)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 11
  },
  editBannerText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center'
  },
  miniMapContainer: {
    position: 'absolute',
    top: 190,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 10,
    padding: 10,
    zIndex: 10,
    minWidth: 120
  },
  miniMapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  miniMapTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  miniMapClose: {
    color: '#fff',
    fontSize: 16
  },
  miniMapContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  miniMapPoint: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  miniMapPointActive: {
    backgroundColor: '#2196F3',
    borderWidth: 2,
    borderColor: '#fff'
  },
  miniMapPointText: {
    fontSize: 14
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 80,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
    zIndex: 10
  },
  controlButton: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  navigationButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.9)'
  },
  editActiveButton: {
    backgroundColor: 'rgba(46, 125, 50, 0.95)'
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600'
  },
  helpContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10
  },
  helpText: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    fontSize: 12,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  // Info card (purple, parang sa screenshot)
  infoCard: {
    backgroundColor: '#5B3F8C',
    borderRadius: 12,
    padding: 18,
    width: '100%',
    maxHeight: height * 0.8
  },
  infoCardContent: {
    alignItems: 'center',
    paddingBottom: 10
  },
  infoImage: {
    width: '100%',
    height: 220,
    marginBottom: 14
  },
  infoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 10
  },
  infoDescription: {
    color: '#f0e9fa',
    fontSize: 14,
    lineHeight: 21,
    alignSelf: 'flex-start'
  },
  infoClose: {
    marginTop: 10,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    alignItems: 'center'
  },
  infoCloseText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  },
  // Form
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxHeight: height * 0.8
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: '#333',
    fontSize: 15
  },
  inputMultiline: {
    minHeight: 110,
    textAlignVertical: 'top'
  },
  stackedButton: {
    flex: 0,
    marginBottom: 10
  },
  navigationButtonSolid: {
    backgroundColor: '#E53935'
  },
  fieldLabel: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  fieldHint: {
    color: '#777',
    fontSize: 12,
    marginBottom: 8
  },
  targetRow: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8
  },
  targetRowActive: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2196F3'
  },
  targetRowText: {
    color: '#333',
    fontSize: 15
  },
  toggleRow: {
    paddingVertical: 10,
    marginBottom: 8
  },
  pickButton: {
    backgroundColor: '#5B3F8C',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12
  },
  previewImage: {
    width: '100%',
    height: 150,
    marginBottom: 12,
    backgroundColor: '#eee'
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  formButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  formCancel: {
    backgroundColor: '#757575'
  },
  formSave: {
    backgroundColor: '#2196F3'
  },
  formDelete: {
    backgroundColor: '#d32f2f',
    marginTop: 10,
    flex: 0
  },
  navigationMenuContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxHeight: height * 0.7
  },
  navigationMenuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center'
  },
  navigationMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 10
  },
  navigationMenuIcon: {
    fontSize: 24,
    marginRight: 15
  },
  navigationMenuTextContainer: {
    flex: 1
  },
  navigationMenuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  navigationMenuItemLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 3
  },
  navigationMenuClose: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#757575',
    borderRadius: 10,
    alignItems: 'center'
  },
  navigationMenuCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default PanoramaViewScreen;