document.addEventListener('DOMContentLoaded', () => {
    // Открытие модального окна по кнопке +
    document.querySelector('[test-id="list-add-button"]').addEventListener('click', () => {
        document.getElementById('createTestModal').style.display = 'flex'
        // Добавляем первый вопрос при открытии формы
        addQuestion()
    })

    // Закрытие модального окна при клике на оверлей
    document.getElementById('createTestModal').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeCreateTestModal()
        }
    })

    // Сохранение теста
    document.querySelector('[test-id="save-button"]').addEventListener('click', () => {
        const title = document.querySelector('[test-id="new-test-title"]').value.trim()
        if (!title) {
            alert('Укажите название теста')
            return
        }

        const questions = []
        let isValid = true

        document.querySelectorAll('.question-block').forEach(questionBlock => {
            const questionText = questionBlock.querySelector('[test-id="new-test-question"]').value.trim()
            const options = []
            let correctAnswer = null

            questionBlock.querySelectorAll('.option-row').forEach((row, index) => {
                const optionText = row.querySelector('input[type="text"]').value.trim()
                const isCorrect = row.querySelector('input[type="radio"]').checked

                if (!optionText) {
                    isValid = false
                    return
                }

                options.push({
                    id: String(index),
                    text: optionText
                })

                if (isCorrect) {
                    correctAnswer = String(index)
                }
            })

            if (!questionText || !correctAnswer || options.length !== 4) {
                isValid = false
                return
            }

            questions.push({
                question: questionText,
                options: options,
                correct: correctAnswer
            })
        })

        if (!isValid) {
            alert('Заполните все поля и выберите правильные ответы')
            return
        }

        const newTest = {
            id: Date.now().toString(),
            title: title,
            questions: questions
        }

        // Сохраняем тест в localStorage
        const tests = JSON.parse(localStorage.getItem('customTests') || '[]')
        tests.push(newTest)
        localStorage.setItem('customTests', JSON.stringify(tests))

        // Обновляем список тестов на странице
        addTestToList(newTest)
        closeCreateTestModal()
    })

    // Загрузка тестов при старте
    const testsList = document.querySelector('[test-id="list-items"]')
    
    // Загрузка предустановленных тестов из data.json
    fetch('data.json')
        .then(response => response.json())
        .then(defaultTests => {
            defaultTests.forEach(test => {
                const testElement = createTestElement(test, false)
                testsList.appendChild(testElement)
            })
            
            // Загружаем пользовательские тесты
            const customTests = JSON.parse(localStorage.getItem('customTests') || '[]')
            customTests.forEach(test => {
                const testElement = createTestElement(test, true)
                testsList.appendChild(testElement)
            })
        })
        .catch(error => {
            console.error('Ошибка загрузки тестов:', error)
            const customTests = JSON.parse(localStorage.getItem('customTests') || '[]')
            customTests.forEach(test => {
                const testElement = createTestElement(test, true)
                testsList.appendChild(testElement)
            })
        })
})

function closeCreateTestModal() {
    document.getElementById('createTestModal').style.display = 'none'
    document.querySelector('.questions-container').innerHTML = ''
    document.querySelector('[test-id="new-test-title"]').value = ''
}

function addQuestion() {
    const questionsContainer = document.querySelector('.questions-container')
    const questionNumber = questionsContainer.children.length + 1

    const questionBlock = document.createElement('div')
    questionBlock.className = 'question-block'
    questionBlock.dataset.question = questionNumber

    questionBlock.innerHTML = `
        <div class="question-header">
            <h3>Вопрос ${questionNumber}</h3>
            <input type="text" test-id="new-test-question" class="form-input" placeholder="Введите вопрос">
            <div class="question-controls">
                <button test-id="add-question-button" class="control-button">+</button>
                <button test-id="remove-question-button" class="control-button" ${questionNumber === 1 ? 'disabled' : ''}>-</button>
            </div>
        </div>
        <div test-id="new-test-options" class="options-grid">
            ${Array(4).fill(0).map((_, index) => `
                <div class="option-row">
                    <input type="radio" name="correct${questionNumber}" value="${index}">
                    <input type="text" class="form-input" placeholder="Вариант ответа ${index + 1}">
                </div>
            `).join('')}
        </div>
    `

    questionsContainer.appendChild(questionBlock)

    // Добавляем обработчики для кнопок + и -
    questionBlock.querySelector('[test-id="add-question-button"]').addEventListener('click', addQuestion)
    questionBlock.querySelector('[test-id="remove-question-button"]').addEventListener('click', () => {
        removeQuestion(questionBlock)
    })
}

function removeQuestion(questionBlock) {
    if (document.querySelectorAll('.question-block').length > 1) {
        questionBlock.remove()
        updateQuestionNumbers()
    }
}

function updateQuestionNumbers() {
    const questions = document.querySelectorAll('.question-block')
    questions.forEach((question, index) => {
        const number = index + 1
        question.dataset.question = number
        question.querySelector('h3').textContent = `Вопрос ${number}`
        
        // Обновляем name для radio buttons
        const radioButtons = question.querySelectorAll('input[type="radio"]')
        radioButtons.forEach(radio => {
            radio.name = `correct${number}`
        })

        // Управляем кнопкой удаления
        const removeButton = question.querySelector('[test-id="remove-question-button"]')
        removeButton.disabled = questions.length === 1
    })
}

function createTestElement(test, isDeletable) {
    const div = document.createElement('div')
    div.className = 'test-item'
    
    const title = document.createElement('span')
    title.setAttribute('test-id', 'list-item-title')
    title.textContent = test.title
    
    const deleteButton = document.createElement('button')
    deleteButton.setAttribute('test-id', 'list-item-delete')
    deleteButton.className = 'delete-button'
    // Добавляем иконку мусорки
    deleteButton.textContent = '🗑' // Или используем CSS-переменную, если она определена
    deleteButton.style.display = 'none'
    
    if (!isDeletable) {
        deleteButton.classList.add('delete-button-disabled')
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation()
        })
    } else {
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation()
            deleteTest(test.id)
            div.remove()
        })
    }
    
    div.appendChild(title)
    div.appendChild(deleteButton)
    
    div.addEventListener('mouseover', () => {
        deleteButton.style.display = 'block'
    })
    
    div.addEventListener('mouseout', () => {
        deleteButton.style.display = 'none'
    })
    
    div.addEventListener('click', () => {
        window.location.href = `test.html?id=${test.id}`
    })
    
    return div
}

// Функция удаления теста
function deleteTest(testId) {
    const tests = JSON.parse(localStorage.getItem('customTests') || '[]')
    const updatedTests = tests.filter(test => test.id !== testId)
    localStorage.setItem('customTests', JSON.stringify(updatedTests))
}

function addTestToList(test) {
    const testElement = createTestElement(test, true)
    document.querySelector('[test-id="list-items"]').appendChild(testElement)
}