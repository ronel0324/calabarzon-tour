import { StyleSheet } from 'react-native';
import { COLORS } from '../theme';

// Gamit ng AddDestinationScreen at EditDestinationScreen
export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.taal // tugma sa header
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.paper
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20
  },
  content: {
    padding: 20,
    paddingBottom: 40
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 8,
    marginTop: 18
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: COLORS.ink
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line
  },
  categoryButtonActive: {
    backgroundColor: COLORS.taal,
    borderColor: COLORS.taal
  },
  categoryButtonText: {
    fontSize: 14,
    color: COLORS.muted
  },
  categoryButtonTextActive: {
    color: COLORS.white,
    fontWeight: '700'
  },
  imagePickerButton: {
    backgroundColor: COLORS.taalSoft,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center'
  },
  imagePickerButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700'
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 10
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10
  },
  changeImageButton: {
    backgroundColor: COLORS.taalSoft,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  changeImageButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700'
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.muted,
    marginTop: 10,
    marginBottom: 6
  },
  panoramaButton: {
    backgroundColor: COLORS.leaf,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center'
  },
  panoramaButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700'
  },
  removePanoramaText: {
    color: COLORS.vermilion,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10
  },
  submitButton: {
    backgroundColor: COLORS.taal,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 30,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.gold // gintong guhit sa ilalim ng pangunahing button
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700'
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.neutral,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20
  },
  cancelButtonText: {
    color: COLORS.neutral,
    fontSize: 16,
    fontWeight: '700'
  }
});
