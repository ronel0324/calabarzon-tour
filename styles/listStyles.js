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
  searchContainer: {
    padding: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line
  },
  searchInput: {
    height: 45,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: COLORS.ink,
    backgroundColor: COLORS.paper
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line
  },
  filterButtonActive: {
    backgroundColor: COLORS.taal,
    borderColor: COLORS.taal
  },
  filterButtonText: {
    fontSize: 14,
    color: COLORS.muted
  },
  filterButtonTextActive: {
    color: COLORS.white,
    fontWeight: '700'
  },
  resultsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 12
  },
  resultsText: {
    fontSize: 13,
    color: COLORS.muted
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20
  },
  card: {
    ...card,
    marginBottom: 15,
    overflow: 'hidden'
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.line
  },
  cardInfo: {
    paddingHorizontal: 15,
    paddingTop: 15
  },
  cardTitle: {
    fontFamily: SERIF,
    fontSize: 21,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 5
  },
  cardCategory: {
    fontSize: 14,
    color: COLORS.goldDeep,
    fontWeight: '700',
    marginBottom: 5
  },
  cardAddress: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 8
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
    marginBottom: 15
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 15
  },
  editButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.taalSoft,
    borderRadius: 10,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: 'center'
  },
  editButtonText: {
    color: COLORS.taalSoft,
    fontWeight: '700',
    fontSize: 14
  },
  deleteButton: {
    flex: 1,
    backgroundColor: COLORS.vermilionTint,
    borderWidth: 1,
    borderColor: COLORS.vermilion,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  deleteButtonText: {
    color: COLORS.vermilion,
    fontWeight: '700',
    fontSize: 14
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  emptyText: {
    fontFamily: SERIF,
    fontSize: 19,
    color: COLORS.muted,
    marginBottom: 20
  },
  addButton: {
    backgroundColor: COLORS.taal,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.gold
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700'
  }
});
