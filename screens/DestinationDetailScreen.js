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
  saveQuizAnswers,
  getQuizAnswersForQuestions,
  getEntryPanoramaPoint
} from '../services/database';
import styles from '../styles/detailStyles';

export default function DestinationDetailScreen({ route, navigation }) {
  const { destinationId } = route.params;
  const [destination, setDestination] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]); // lahat ng tanong ng destination
  const [answerStats, setAnswerStats] = useState({ answered: 0, correct: 0 }); // galing quiz_answers
  const [quizQueue, setQuizQueue] = useState([]); // mga hindi pa nasasagutan (ito ang lalabas sa quiz)
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0); // tama sa kasalukuyang round
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
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

      const answers = await getQuizAnswersForQuestions(questions.map((q) => q.id));
      setAnswerStats({
        answered: answers.length,
        correct: answers.filter((a) => a.is_correct).length
      });

      const entry = await getEntryPanoramaPoint(destinationId);
      setHasPanorama(!!entry);
    } catch (error) {
      console.error('Error loading destination:', error);
      Alert.alert('Error', 'Failed to load destination details');
    }
  };

  const startQuiz = async () => {
    if (quizQuestions.length === 0) {
      Alert.alert('No Quiz Available', 'This destination does not have a quiz yet.');
      return;
    }

    try {
      // Mga tanong lang na hindi pa nasasagutan ang ilalabas (resume)
      const answers = await getQuizAnswersForQuestions(quizQuestions.map((q) => q.id));
      const answeredIds = new Set(answers.map((a) => a.question_id));
      const remaining = quizQuestions.filter((q) => !answeredIds.has(q.id));

      if (remaining.length === 0) {
        Alert.alert('All done', 'You have answered every question for this destination.');
        return;
      }

      setQuizQueue(remaining);
      setShowQuiz(true);
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setQuizCompleted(false);
    } catch (error) {
      console.error('Error starting quiz:', error);
      Alert.alert('Error', 'Could not load your quiz progress. Try again.');
    }
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = async () => {
    if (!selectedAnswer) {
      Alert.alert('Select an Answer', 'Please select an answer before proceeding.');
      return;
    }
    if (saving) return;

    const currentQuestion = quizQueue[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;

    // I-save agad ang sagot sa quiz_answers para hindi mawala kapag lumabas ang user
    setSaving(true);
    try {
      await saveQuizAnswers([
        {
          question_id: currentQuestion.id,
          selected_answer: selectedAnswer,
          is_correct: isCorrect
        }
      ]);
    } catch (error) {
      console.error('Error saving answer:', error);
      Alert.alert('Could not save answer', error.message || 'Try again.');
      setSaving(false);
      return;
    }
    setSaving(false);

    if (isCorrect) setScore((s) => s + 1);

    if (currentQuestionIndex < quizQueue.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      // Tapos na ang round
      setQuizCompleted(true);
      loadDestinationData(); // i-refresh ang progress card
    }
  };

  const closeQuiz = () => {
    setShowQuiz(false);
    setQuizCompleted(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    loadDestinationData(); // i-update ang progress kapag umalis sa gitna
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
    const currentQuestion = quizQueue[currentQuestionIndex];
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
            Question {answerStats.answered + currentQuestionIndex + 1} of {quizQuestions.length}
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
            style={[styles.nextButton, saving && { opacity: 0.6 }]}
            onPress={handleNextQuestion}
            disabled={saving}
          >
            <Text style={styles.nextButtonText}>
              {saving
                ? 'Saving...'
                : currentQuestionIndex === quizQueue.length - 1
                ? 'Finish Quiz'
                : 'Next Question'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (quizCompleted) {
    const roundTotal = quizQueue.length;
    const percentageScore = roundTotal ? Math.round((score / roundTotal) * 100) : 0;
    const passed = percentageScore >= 60;

    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Quiz Completed! 🎉</Text>
        <Text style={styles.resultScore}>{score} / {roundTotal}</Text>
        <Text style={styles.resultPercentage}>{percentageScore}%</Text>
        <Text style={[styles.resultStatus, passed ? styles.passed : styles.failed]}>
          {passed ? 'Congratulations! You passed!' : 'Keep learning!'}
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={closeQuiz}
        >
          <Text style={styles.backButtonText}>Back to Details</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const total = quizQuestions.length;
  const remainingCount = total - answerStats.answered;
  const quizButtonLabel =
    total === 0
      ? 'No Quiz Available'
      : answerStats.answered === 0
      ? `Take Quiz (${total} questions)`
      : remainingCount > 0
      ? `Resume Quiz (${remainingCount} left)`
      : 'Quiz Completed';

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

        {answerStats.answered > 0 && (
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Your Progress</Text>
            <Text style={styles.progressScore}>
              Answered: {answerStats.answered} / {total}
            </Text>
            <Text style={styles.progressStatus}>
              Correct: {answerStats.correct}
              {remainingCount === 0 ? '  ✅ Completed' : '  ⏳ In Progress'}
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
            <Text style={styles.quizButtonText}>{quizButtonLabel}</Text>
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