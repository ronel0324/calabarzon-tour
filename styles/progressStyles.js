import { StyleSheet } from 'react-native';
import { COLORS, SERIF, card } from '../theme';

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.taal
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.paper
  },
  scrollContent: {
    paddingBottom: 20
  },
  content: {
    padding: 20
  },
  sectionTitle: {
    fontFamily: SERIF,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 15
  },
  statsContainer: {
    ...card,
    padding: 20,
    marginBottom: 20
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.paper,
    borderRadius: 10,
    borderTopWidth: 3,
    borderTopColor: COLORS.gold,
    marginHorizontal: 4
  },
  statNumber: {
    fontFamily: SERIF,
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.taal,
    marginBottom: 5
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center'
  },
  filterContainer: {
    ...card,
    flexDirection: 'row',
    marginBottom: 20,
    padding: 4
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10
  },
  filterButtonActive: {
    backgroundColor: COLORS.taal
  },
  filterButtonText: {
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: '600'
  },
  filterButtonTextActive: {
    color: COLORS.white,
    fontWeight: '700'
  },
  progressCard: {
    ...card,
    padding: 15,
    marginBottom: 12
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  destinationName: {
    fontFamily: SERIF,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
    flex: 1,
    marginRight: 8
  },
  completedBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.leaf,
    backgroundColor: COLORS.leafTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden'
  },
  inProgressBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.goldDeep,
    backgroundColor: '#F8EFD9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden'
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.taal
  },
  dateText: {
    fontSize: 13,
    color: COLORS.muted
  },
  emptyContainer: {
    ...card,
    alignItems: 'center',
    padding: 40
  },
  emptyText: {
    fontFamily: SERIF,
    fontSize: 19,
    color: COLORS.muted,
    marginBottom: 8,
    textAlign: 'center'
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8A9598',
    marginBottom: 20,
    textAlign: 'center'
  },
  browseButton: {
    backgroundColor: COLORS.taal,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.gold
  },
  browseButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700'
  }
});
