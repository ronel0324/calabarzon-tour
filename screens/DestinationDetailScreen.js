import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  SafeAreaView
} from 'react-native';
import {
  getDestinationById,
  getQuizQuestionsByDestination,
  saveProgress,
  getProgress,
  getEntryPanoramaPoint
} from '../services/database';

export default function DestinationDetailScreen({ route, navigation }) {
  const { destinationId } = route.params;
  const [destination, setDestination] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [progress, setProgress] = useState(null);
  const [hasPanorama, setHasPanorama] = useState(false);

  useEffect(() => {
    loadDestinationData();
  }, [destinationId]);

  const loadDestinationData = async () => {
    try {
      const dest = await getDestinationById(destinationId);
      setDestination(dest);

      const questions = await getQuizQuestionsByDestination(destinationId);
      setQuizQuestions(questions);

      const prog = await getProgress(destinationId);
      setProgress(prog);

      const entry = await getEntryPanoramaPoint(destinationId);
      setHasPanorama(!!entry);
    } catch (error) {
      console.error('Error loading destination:', error);
      Alert.alert('Error', 'Failed to load destination details');
    }
  };

  const startQuiz = () => {
    if (quizQuestions.length === 0) {
      Alert.alert('No Quiz Available', 'This destination does not have a quiz yet.');
      return;
    }
    setShowQuiz(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setQuizCompleted(false);
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = async () => {
    if (!selectedAnswer) {
      Alert.alert('Select an Answer', 'Please select an answer before proceeding.');
      return;
    }

    const currentQuestion = quizQuestions[currentQuestionIndex];
    let newScore = score;

    if (selectedAnswer === currentQuestion.correct_answer) {
      newScore = score + 1;
      setScore(newScore);
    }

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      } else {
    // Quiz completed
      setQuizCompleted(true);
      const percentageScore = Math.round((newScore / quizQuestions.length) * 100);
      const completed = percentageScore >= 60;

      try {
        await saveProgress(destinationId, percentageScore, completed);
        await loadDestinationData();
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    }
  };

  const closeQuiz = () => {
    setShowQuiz(false);
    setQuizCompleted(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
  };

  const handleView360 = async () => {
    const entry = await getEntryPanoramaPoint(destinationId);
    if (!entry) {
      Alert.alert('No 360° View', 'This destination does not have a 360° view yet.');
      return;
    }
    navigation.navigate('PanoramaView', {
      destinationId: destination.id,
      destinationName: destination.name,
      entryPointId: entry.id
    });
  };

  if (!destination) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (showQuiz && !quizCompleted) {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const options = [
      { key: 'A', text: currentQuestion.option_a },
      { key: 'B', text: currentQuestion.option_b },
      { key: 'C', text: currentQuestion.option_c },
      { key: 'D', text: currentQuestion.option_d }
    ];

    return (
      <View style={styles.quizContainer}>
        <View style={styles.quizHeader}>
          <Text style={styles.quizProgress}>
            Question {currentQuestionIndex + 1} of {quizQuestions.length}
          </Text>
          <TouchableOpacity onPress={closeQuiz}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quizContent}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>

          <View style={styles.optionsContainer}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.optionButton,
                  selectedAnswer === option.key && styles.optionButtonSelected
                ]}
                onPress={() => handleAnswerSelect(option.key)}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionKey}>{option.key}</Text>
                  <Text style={styles.optionText}>{option.text}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextQuestion}
          >
            <Text style={styles.nextButtonText}>
              {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (quizCompleted) {
    const percentageScore = Math.round((score / quizQuestions.length) * 100);
    const passed = percentageScore >= 60;

    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Quiz Completed! 🎉</Text>
        <Text style={styles.resultScore}>{score} / {quizQuestions.length}</Text>
        <Text style={styles.resultPercentage}>{percentageScore}%</Text>
        <Text style={[styles.resultStatus, passed ? styles.passed : styles.failed]}>
          {passed ? 'Congratulations! You passed!' : 'Keep learning and try again!'}
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={closeQuiz}
        >
          <Text style={styles.backButtonText}>Back to Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={startQuiz}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <Image
        source={{ uri: destination.image || 'https://via.placeholder.com/400x300?text=No+Image' }}
        style={styles.image}
      />

      <View style={styles.content}>
        <Text style={styles.title}>{destination.name}</Text>
        <Text style={styles.category}>{destination.category}</Text>
        <Text style={styles.address}>📍 {destination.address}</Text>

        {progress && (
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Your Progress</Text>
            <Text style={styles.progressScore}>Quiz Score: {progress.quiz_score}%</Text>
            <Text style={styles.progressStatus}>
              Status: {progress.completed ? '✅ Completed' : '⏳ In Progress'}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.sectionText}>{destination.description}</Text>
        </View>

        {destination.historical_info && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historical Information</Text>
            <Text style={styles.sectionText}>{destination.historical_info}</Text>
          </View>
        )}

        {destination.cultural_significance && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cultural Significance</Text>
            <Text style={styles.sectionText}>{destination.cultural_significance}</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          {hasPanorama && (
            <TouchableOpacity
              style={styles.view360Button}
              onPress={handleView360}
            >
              <Text style={styles.view360ButtonText}>🌐 View 360°</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.quizButton}
            onPress={startQuiz}
          >
            <Text style={styles.quizButtonText}>
              {quizQuestions.length > 0
                ? `Take Quiz (${quizQuestions.length} questions)`
                : 'No Quiz Available'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editSmallButton}
            onPress={() => navigation.navigate('EditDestination', { destinationId: destination.id })}
          >
            <Text style={styles.editSmallButtonText}>Edit Info</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#4CAF50', // Match header color
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 20, // Reduced since SafeAreaView handles spacing
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#e0e0e0',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  category: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  progressCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  progressScore: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  progressStatus: {
    fontSize: 14,
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  actionButtons: {
    marginTop: 10,
    marginBottom: 20,
  },
  view360Button: {
    backgroundColor: '#9C27B0',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  view360ButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quizButton: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  quizButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  editSmallButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editSmallButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Quiz Styles
  quizContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  quizProgress: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 30,
    color: '#666',
  },
  quizContent: {
    flex: 1,
    padding: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    lineHeight: 28,
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionButton: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  optionButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionKey: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 12,
    width: 30,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Result Styles
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  resultScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  resultPercentage: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 20,
  },
  resultStatus: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 40,
  },
  passed: {
    color: '#4CAF50',
  },
  failed: {
    color: '#f44336',
  },
  backButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 15,
    marginBottom: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 15,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});



