const state = {
    questions: [],
    current: 0,
    score: 0,
    locked: false,
};

const app = document.getElementById('quiz-app');
const topicSlug = app.dataset.topicSlug;

const els = {
    question: document.getElementById('question_text'),
    answers: document.getElementById('answers_block'),
    result: document.getElementById('result_block'),
    data: document.getElementById('quiz-data')
};

// CSRF
function getCsrfToken() {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : '';
}

// shuffle (Fisher-Yates)
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// 🔥 ВОТ ГЛАВНОЕ ИЗМЕНЕНИЕ
const originalQuestions = JSON.parse(els.data.textContent);
state.questions = shuffle(originalQuestions).slice(0,5);

function renderQuestion() {
    if (state.current >= state.questions.length) {
        finishQuiz();
        return;
    }

    state.locked = false;

    const q = state.questions[state.current];
    els.question.textContent = q.question;

    // перемешиваем ответы
    const answers = shuffle(
        q.answers.map((text, i) => ({
            text,
            isCorrect: i === q.correct_index
        }))
    );

    els.answers.innerHTML = answers.map((a, i) => `
        <label class="answer_item" data-index="${i}">
            <div class="box_radio">
                <input type="radio" name="answer">
            </div>
            <span>${a.text}</span>
        </label>
    `).join('');

    els.answers.querySelectorAll('.answer_item').forEach((item, index) => {
        item.addEventListener('click', () => {
            if (state.locked) return;
            state.locked = true;

            const selected = answers[index];
            
            const quest_block = document.querySelector('.quest_block');

            if (selected.isCorrect) {
                quest_block.classList.add('correct');
                item.classList.add('correct');
                state.score++;
            } else {
                item.classList.add('wrong');

                const correctIndex = answers.findIndex(a => a.isCorrect);
                const correctItem = els.answers.children[correctIndex];

                if (correctItem) {
                    correctItem.classList.add('correct');
                }
            }

            setTimeout(() => {
                state.current++;
                renderQuestion();
                quest_block.classList.remove('correct')
            }, 1000);
        });
    });
}

function finishQuiz() {
    els.question.textContent = 'Викторина завершена';
    const quest_block = document.querySelector('.quest_block');
    els.answers.style.display = 'none';

    els.result.style.display = 'flex';
    els.result.innerHTML = `
        <p>Верных ответов: ${state.score} / ${state.questions.length}</p>
        <p>Начисление награды...</p>
    `;

    fetch('/space/quiz_complete/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({
            score: state.score,
            topic_slug: topicSlug
        })
    })
    .then(res => res.json())
    .then(data => {
        els.result.innerHTML = `
            <p>Верных ответов: ${state.score} / ${state.questions.length}</p>
            <p>Ты получил: ${data.earned_xp} Космо опыта</p>
        `;
        quest_block.classList.add('correct');
    })
    .catch(() => {
        els.result.innerHTML += `<p>Ошибка начисления награды.</p>`;
    });
}

document.addEventListener('DOMContentLoaded', renderQuestion);