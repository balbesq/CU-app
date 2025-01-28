document.addEventListener('DOMContentLoaded', () => {
    
    document.querySelector('.nav-header').addEventListener('click', () => {
        window.location.href = 'index.html'
    })

    const urlParams = new URLSearchParams(window.location.search)
    const testId = urlParams.get('id')
    
    const testTitle = document.querySelector('.test-title')
    const questionText = document.querySelector('[test-id="question"]')
    const optionsContainer = document.querySelector('[test-id="options"]')
    const questionsList = document.querySelector('.questions-list')
    
    let currentTest = null
    let currentQuestionIndex = 0
    let answerStates = {}
    let isTestCompleted = false

    function validateQuestion(question) {
        const texts = new Set()
        question.options.forEach(option => {
            if (texts.has(option.text)) {
                console.error(`Duplicate answer found in question: ${question.question}`)
            }
            texts.add(option.text)
        })
    }

    function showQuestion(index) {
        const question = currentTest.questions[index]
        questionText.textContent = question.question
        
        optionsContainer.innerHTML = ''
        question.options.forEach(option => {
            const button = document.createElement('button')
            button.className = 'option-button'
            button.textContent = option.text
            button.dataset.id = option.id

            if (!isTestCompleted) {
                button.addEventListener('click', () => selectAnswer(option))
            } else {
                button.disabled = true
            }

            optionsContainer.appendChild(button)
        })

        updateNavigationButtons()
    }

    function selectAnswer(answer) {
        const currentQuestion = currentTest.questions[currentQuestionIndex]
        const isCorrect = answer.id === currentQuestion.correct

        answerStates[currentQuestionIndex] = {
            selectedAnswer: answer,
            isCorrect: isCorrect
        }

        const buttons = optionsContainer.querySelectorAll('.option-button')
        buttons.forEach(button => {
            button.classList.remove('selected', 'correct', 'incorrect')
            if (button.dataset.id === answer.id) {
                button.classList.add('selected')
                button.classList.add(isCorrect ? 'correct' : 'incorrect')
            }
        })

        updateQuestionStatus(currentQuestionIndex)
        saveTestState()
    }

    function updateQuestionStatus(questionIndex) {
        const questionButtons = questionsList.querySelectorAll('.question-item')
        const button = questionButtons[questionIndex]
        
        button.classList.remove('correct', 'incorrect')
        if (answerStates[questionIndex]) {
            button.classList.add(answerStates[questionIndex].isCorrect ? 'correct' : 'incorrect')
        }
    }

    function updateNavigationButtons() {
        const prevButton = document.querySelector('[test-id="prev-question"]')
        const nextButton = document.querySelector('[test-id="next-question"]')
        
        prevButton.classList.toggle('disabled', currentQuestionIndex === 0)
        nextButton.classList.toggle('disabled', currentQuestionIndex === currentTest.questions.length - 1)
    }

    function updateActiveQuestion() {
        const questions = questionsList.querySelectorAll('.question-item')
        questions.forEach((q, index) => {
            q.classList.toggle('active', index === currentQuestionIndex)
        })
    }

    function calculateResults() {
        let correct = 0
        let incorrect = 0
        let unanswered = 0
        
        currentTest.questions.forEach((_, index) => {
            if (!answerStates[index]) {
                unanswered++
            } else if (answerStates[index].isCorrect) {
                correct++
            } else {
                incorrect++
            }
        })
        
        return { correct, incorrect, unanswered }
    }

    function showResults() {
        const results = calculateResults()
        
        document.getElementById('correctAnswers').textContent = results.correct
        document.getElementById('incorrectAnswers').textContent = results.incorrect
        
        const unansweredContainer = document.getElementById('unansweredContainer')
        if (results.unanswered > 0) {
            document.getElementById('unansweredQuestions').textContent = results.unanswered
            unansweredContainer.style.display = 'block'
        } else {
            unansweredContainer.style.display = 'none'
        }
        
        document.getElementById('resultsModal').style.display = 'flex'
    }

    function finishTest() {
        const results = calculateResults()
        if (results.unanswered > 0) {
            document.getElementById('confirmModal').style.display = 'flex'
        } else {
            showResults()
        }
    }

    function restartTest() {
        document.getElementById('restartConfirmModal').style.display = 'flex'
    }

    function confirmRestart() {
        document.getElementById('restartConfirmModal').style.display = 'none'
        
        isTestCompleted = false
        answerStates = {}
        currentQuestionIndex = 0
        
        localStorage.removeItem(`test_${testId}`)
        
        const finishButton = document.querySelector('[test-id="finish-button"]')
        finishButton.textContent = 'Завершить'
        finishButton.replaceWith(finishButton.cloneNode(true))
        document.querySelector('[test-id="finish-button"]').addEventListener('click', finishTest)
        
        const questionButtons = questionsList.querySelectorAll('.question-item')
        questionButtons.forEach(button => {
            button.classList.remove('correct', 'incorrect')
        })
        
        showQuestion(currentQuestionIndex)
        updateActiveQuestion()
    }

    function saveTestState() {
        const testState = {
            answers: answerStates,
            isCompleted: isTestCompleted
        }
        localStorage.setItem(`test_${testId}`, JSON.stringify(testState))
    }

    function loadTestState() {
        const savedState = localStorage.getItem(`test_${testId}`)
        if (savedState) {
            const testState = JSON.parse(savedState)
            answerStates = testState.answers
            isTestCompleted = testState.isCompleted

            if (isTestCompleted) {
                const finishButton = document.querySelector('[test-id="finish-button"]')
                finishButton.textContent = 'Пройти тест заново'
                finishButton.replaceWith(finishButton.cloneNode(true))
                document.querySelector('[test-id="finish-button"]').addEventListener('click', restartTest)
            }

            Object.keys(answerStates).forEach(index => {
                updateQuestionStatus(Number(index))
            })
        }
    }

    // Event Listeners
    document.querySelector('[test-id="prev-question"]').addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--
            showQuestion(currentQuestionIndex)
            updateActiveQuestion()
        }
    })

    document.querySelector('[test-id="next-question"]').addEventListener('click', () => {
        if (currentQuestionIndex < currentTest.questions.length - 1) {
            currentQuestionIndex++
            showQuestion(currentQuestionIndex)
            updateActiveQuestion()
        }
    })

    document.querySelector('[test-id="finish-button"]').addEventListener('click', finishTest)

    document.querySelector('[test-id="reset-test-button"]').addEventListener('click', () => {
        document.getElementById('resultsModal').style.display = 'none'
        isTestCompleted = true
        
        const finishButton = document.querySelector('[test-id="finish-button"]')
        finishButton.textContent = 'Пройти тест заново'
        finishButton.replaceWith(finishButton.cloneNode(true))
        document.querySelector('[test-id="finish-button"]').addEventListener('click', restartTest)
        
        const buttons = optionsContainer.querySelectorAll('.option-button')
        buttons.forEach(button => {
            button.classList.remove('correct', 'incorrect', 'selected')
            button.disabled = true
        })
        
        saveTestState()
        showQuestion(currentQuestionIndex)
    })

    document.getElementById('confirmYes').addEventListener('click', () => {
        document.getElementById('confirmModal').style.display = 'none'
        showResults()
    })

    document.getElementById('confirmNo').addEventListener('click', () => {
        document.getElementById('confirmModal').style.display = 'none'
    })

    document.getElementById('restartYes').addEventListener('click', confirmRestart)
    document.getElementById('restartNo').addEventListener('click', () => {
        document.getElementById('restartConfirmModal').style.display = 'none'
    })

    // Initialize
    fetch('data.json')
    .then(response => response.json())
    .then(tests => {
        // Сначала ищем в предустановленных тестах
        currentTest = tests.find(test => test.id === testId)
        
        // Если тест не найден в предустановленных, ищем в пользовательских
        if (!currentTest) {
            const customTests = JSON.parse(localStorage.getItem('customTests') || '[]')
            currentTest = customTests.find(test => test.id === testId)
        }
        
        if (!currentTest) {
            throw new Error('Тест не найден')
        }

        testTitle.textContent = currentTest.title
        currentTest.questions.forEach(validateQuestion)
        
        currentTest.questions.forEach((question, index) => {
            const button = document.createElement('button')
            button.className = 'question-item'
            button.textContent = `Вопрос ${index + 1}`
            if (index === 0) button.classList.add('active')
            
            button.addEventListener('click', () => {
                currentQuestionIndex = index
                showQuestion(currentQuestionIndex)
                updateActiveQuestion()
            })
            
            questionsList.appendChild(button)
        })

        loadTestState()
        showQuestion(currentQuestionIndex)
    })
    .catch(error => {
        console.error('Ошибка загрузки теста:', error)
        testTitle.textContent = 'Ошибка загрузки теста'
    })
})