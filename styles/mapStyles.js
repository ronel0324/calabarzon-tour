import { StyleSheet } from 'react-native';
import { COLORS, SERIF } from '../theme';

// Ang kulay ng mga pin ay nasa categoryColors pa rin sa MapScreen.js (hindi ito ginagalaw).
// Ang asul (#1976D2) ay ginagamit pa rin sa ruta/directions para tugma sa linya sa mapa.
export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.taal
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  mapWrapper: {
    flex: 1
  },
  map: {
    flex: 1
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.paper
  },
  controlsContainer: {
    position: 'absolute',
    top: 60,
    right: 15,
    gap: 10
  },
  controlButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 3
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink
  },
  counterContainer: {
    position: 'absolute',
    top: 10,
    left: 15,
    backgroundColor: COLORS.taal,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
    elevation: 3
  },
  counterText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white
  },

  // Filter bar
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line
  },
  chipScroll: {
    flex: 1
  },
  chipRow: {
    alignItems: 'center',
    gap: 8,
    paddingRight: 8
  },
  chip: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16
  },
  chipActive: {
    backgroundColor: COLORS.taal,
    borderColor: COLORS.taal
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted
  },
  chipTextActive: {
    color: COLORS.white
  },
  categoryButton: {
    maxWidth: 140,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.taal,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16
  },
  categoryButtonActive: {
    backgroundColor: COLORS.taal
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.taal
  },
  categoryButtonTextActive: {
    color: COLORS.white
  },
  categoryMenu: {
    position: 'absolute',
    top: 0,
    right: 10,
    width: 210,
    maxHeight: 340,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14
  },
  categoryItemActive: {
    backgroundColor: COLORS.tealTint
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10
  },
  categoryItemText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.ink
  },
  categoryItemTextActive: {
    fontWeight: '700',
    color: COLORS.taal
  },
  categoryCheck: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.taal
  },

  // Route
  routeLoading: {
    position: 'absolute',
    top: 50,
    left: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    elevation: 3
  },
  routeLoadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976D2'
  },
  routeCard: {
    position: 'absolute',
    left: 15,
    right: 15,
    bottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderTopWidth: 3,
    borderTopColor: COLORS.gold,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  routeCardInfo: {
    flex: 1
  },
  routeCardName: {
    fontFamily: SERIF,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 4
  },
  routeStatsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10
  },
  routeDuration: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.taal
  },
  routeDistance: {
    fontSize: 15,
    color: COLORS.muted
  },
  routeNote: {
    fontSize: 10,
    color: '#8A9598',
    marginTop: 2
  },
  routeClearButton: {
    backgroundColor: COLORS.neutral,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 10
  },
  routeClearText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600'
  },

  // Legend
  legendContainer: {
    backgroundColor: COLORS.white,
    paddingTop: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.line
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: COLORS.ink
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15
  },
  legendColor: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    marginRight: 5
  },
  legendText: {
    fontSize: 11,
    color: COLORS.muted
  },

  // Info modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 59, 67, 0.55)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: COLORS.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden'
  },
  modalImage: {
    width: '100%',
    height: 160
  },
  modalScrollView: {
    maxHeight: 220,
    paddingHorizontal: 20,
    paddingTop: 15
  },
  modalTitle: {
    fontFamily: SERIF,
    fontSize: 25,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 10
  },
  modalCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.taal,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginBottom: 15
  },
  modalCategoryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600'
  },
  modalSection: {
    marginBottom: 15
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.goldDeep,
    marginBottom: 5
  },
  modalText: {
    fontSize: 14,
    color: COLORS.ink,
    lineHeight: 20
  },
  modalButtons: {
    paddingHorizontal: 20,
    paddingTop: 15,
    gap: 10
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  detailsButton: {
    backgroundColor: COLORS.taal,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.gold
  },
  view360Button: {
    backgroundColor: COLORS.leaf
  },
  directionsButton: {
    backgroundColor: '#1976D2'
  },
  closeButton: {
    backgroundColor: COLORS.neutral
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600'
  }
});
