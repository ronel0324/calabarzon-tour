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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.paper
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: COLORS.line
  },
  content: {
    padding: 20
  },
  title: {
    fontFamily: SERIF,
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 8
  },
  category: {
    fontSize: 15,
    color: COLORS.goldDeep,
    fontWeight: '700',
    marginBottom: 8
  },
  address: {
    fontSize: 15,
    color: COLORS.muted,
    marginBottom: 20
  },
  progressCard: {
    backgroundColor: COLORS.leafTint,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.leaf,
    padding: 15,
    marginBottom: 20
  },
  progressTitle: {
    fontFamily: SERIF,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.leaf,
    marginBottom: 8
  },
  progressScore: {
    fontSize: 14,
    color: COLORS.ink,
    marginBottom: 4
  },
  progressStatus: {
    fontSize: 14,
    color: COLORS.ink
  },
  section: {
    ...card,
    padding: 16,
    marginBottom: 15
  },
  sectionTitle: {
    fontFamily: SERIF,
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.taal,
    marginBottom: 10
  },
  sectionText: {
    fontFamily: SERIF,
    fontSize: 15,
    color: '#3B484B',
    lineHeight: 25
  },
  actionButtons: {
    marginTop: 10,
    marginBottom: 20
  },
  view360Button: {
    backgroundColor: COLORS.taal,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.gold
  },
  view360ButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700'
  },
  quizButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10
  },
  quizButtonText: {
    color: COLORS.ink, // madilim na teksto para mabasa sa ginto
    fontSize: 17,
    fontWeight: '700'
  },
  editSmallButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.taalSoft,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  editSmallButtonText: {
    color: COLORS.taalSoft,
    fontSize: 15,
    fontWeight: '700'
  },

  // Quiz
  quizContainer: {
    flex: 1,
    backgroundColor: COLORS.paper
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.taal,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.gold
  },
  quizProgress: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white
  },
  closeButton: {
    fontSize: 28,
    color: COLORS.white
  },
  quizContent: {
    flex: 1,
    padding: 20
  },
  questionText: {
    fontFamily: SERIF,
    fontSize: 21,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 28,
    lineHeight: 30
  },
  optionsContainer: {
    marginBottom: 30
  },
  optionButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.line,
    borderRadius: 12,
    padding: 15,
    marginBottom: 12
  },
  optionButtonSelected: {
    borderColor: COLORS.taal,
    backgroundColor: COLORS.tealTint
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  optionKey: {
    fontFamily: SERIF,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.goldDeep,
    marginRight: 12,
    width: 30
  },
  optionText: {
    fontSize: 16,
    color: COLORS.ink,
    flex: 1
  },
  nextButton: {
    backgroundColor: COLORS.taal,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: COLORS.gold
  },
  nextButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700'
  },

  // Result
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.paper
  },
  resultTitle: {
    fontFamily: SERIF,
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 20
  },
  resultScore: {
    fontFamily: SERIF,
    fontSize: 52,
    fontWeight: '700',
    color: COLORS.taal,
    marginBottom: 10
  },
  resultPercentage: {
    fontFamily: SERIF,
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.goldDeep,
    marginBottom: 20
  },
  resultStatus: {
    fontSize: 19,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 40
  },
  passed: {
    color: COLORS.leaf
  },
  failed: {
    color: COLORS.vermilion
  },
  backButton: {
    backgroundColor: COLORS.taal,
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 15,
    marginBottom: 12
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700'
  },
  retryButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 15
  },
  retryButtonText: {
    color: COLORS.ink,
    fontSize: 17,
    fontWeight: '700'
  }
});
