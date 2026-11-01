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
import styles from '../styles/detailStyles';

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