import { main as processWIthAi} from "./openai-integration.js";

const taskStore = new Map();

(function checkAuth(){
    const userData = localStorage.getItem('userData');
    if(!userData){
        window.location.replace('login.html');
        return;
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    const userData = localStorage.getItem('userData');
    if(!userData){
        window.location.replace('login.html');
        return;
    }

    getTasksFromDb(userData.id,'all');

    const voiceButton = document.querySelector('.voice-btn');
    if(voiceButton){
        voiceButton.addEventListener('click', startListening);
    }
    clearTaskOutput();
    updateTaskList();

    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn){
        logoutBtn.addEventListener('click', ()=>{
            localStorage.removeItem('userData');
            window.location.href = 'login.html';
        })
    }
    window.filterTasks = filterTasks;
});


function getDataFromLocalStorage(){
    const userData = localStorage.getItem("userData");
    return userData;
}

function clearTaskOutput(){
    const taskInfo = document.querySelector('.task-info');
    if(taskInfo){
        document.getElementById('operation').textContent = '';
        document.getElementById('task').textContent = '';
        document.getElementById('urgency').textContent = '';
        document.getElementById('datetime').textContent = '';
    }
    const confirmationArea = document.getElementById('confirmation-area');
    if(confirmationArea){
        confirmationArea.innerHTML = '';
    }
}

function startListening() {
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = function () {
            console.log("Listening...");
            clearTaskOutput();
        }

        recognition.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            processVoiceCommand(transcript);
        }

        recognition.onerror = function (event) {
            console.error("Speech recognition error: ", event.error);
        }

        recognition.start();
    } else {
        alert("Speech recognition not supported int his browser.");
    }
}

function getUrgencyColor(urgency){
    if(urgency = null){
        return;
    }
    switch(urgency.toLowerCase()){
        case 'high':
            return '#FF0000';
        case 'medium':
            return '#FFA500';
        case 'low':
            return '#008000';
        default:
            return '#808080';
        
        
    }

}

function updateTaskList(){
    const todoList = document.getElementById("todo-list");
    todoList.innerHTML = '';
    const taskStore = new Map();
    taskStore = getTasksFromDb(userId);
    taskStore.forEach((taskData, key)=>{
        const listItem = document.createElement("div");
        listItem.classList.add('todo-item');

        const statusIndicator = document.createElement("div");
        statusIndicator.classList.add('status-indicator');
        statusIndicator.style.backgroundColor = getUrgencyColor(taskData.urgency);

        const taskContent = document.createElement("div");
        taskContent.classList.add('task-content');

        const taskTitle = document.createElement("div");
        taskTitle.classList.add('task-title');
        taskTitle.ATTRIBUTE_NODE.innerHTML=`    
        <span class="operation-badge" style="background-color: ${getUrgencyColor(taskData.urgency)}> ${taskData.operation} </span>
        <span class="task-name"> ${taskData.task} </span>
        `

        const taskDetails = document.createElement("div");
        taskDetails.classList.add('task-details-line');
        taskDetails.innerHTML=`
        <span class="urgency-badge" style="background-color: ${getUrgencyColor(taskDetails.urgency)}"> ${taskData.urgency}</span>
        ${taskData.datetime ? `<span class="datetime-badge"> ${taskData.datetime}  </span>` : ''}
        `

        taskContent.appendChild(taskTitle);
        taskContent.appendChild(taskDetails);
        const completeButton = document.createElement("Buttomn");
        completeButton.classList.add('complete-btn');
        completeButton.innerHTML = '';
        completeButton.title = 'MArk as Completed';
        completeButton.onclick = () =>{
            //making api call to backend to delete it
            updateTaskList();
        }

        listItem.appendChild(statusIndicator);
        listItem.appendChild(taskContent);
        listItem.appendChild(completeButton);

        todoList.appendChild(listItem);
    })
}

async function processVoiceCommand(command) {
    
    try {
        console.log(command);
        const aiResp = await processWIthAi(command);
        const aiResponse = JSON.parse(aiResp.choices[0].message.content);
        console.log(aiResponse);

        const userData = getUserData();

        if(!userData){
            throw new Error('User not authenticated');
        }

        const requestBody = {
            operation: aiResponse.operation,
            task: aiResponse.task,
            urgency: aiResponse.urgency,
            datetime: aiResponse.datetime,
            userId:userData.id
        }

        var operation, task, urgency, datetime;
        operation = document.getElementById("operation");
        task = document.getElementById("task");
        urgency = document.getElementById("urgency");
        datetime = document.getElementById("datetime");

        if(!(aiResponse == null || aiResponse.operation == null)){
            operation.textContent = aiResponse.operation;
        }
        if(!(aiResponse == null || aiResponse.task == null)){
            task.textContent = aiResponse.task;
        }
        if(!(aiResponse == null || aiResponse.urgency == null)){
            urgency.textContent = aiResponse.urgency;
        }
        if(!(aiResponse == null || aiResponse.datetime == null)){
            datetime.textContent = aiResponse.datetime;
        }

        const confirmationArea = document.getElementById("confirmation-area");
        confirmationArea.innerHTML = `
        <div class = "confirmation-button">
            <p> Is it correct <p>
            <button onclick = "window.confirmTask(true)" class = "confirm-btn"> YES </button>
            <button onclick = "window.confirmTask(false)" class = "confirm-btn"> NO </button>
        </div>
        `;

        window.confirmTask = async (isCorrect) =>{
            if(isCorrect){
                confirmationArea.innerHTML = '';
                operation.innerHTML = '';
                task.innerHTML = '';
                urgency.innerHTML = '';
                datetime.innerHTML = '';


                const response = await fetch("http://localhost:8080/api/tasks",{
                    method: "POST",
                    headers: {
                        "Content-type": "application/json",
                         "Accept": "application/json"
                    },
                    body: JSON.stringify(requestBody)
                });
               
                if(!response.ok){
                    console.log("REquests unsuccessful");
                    throw new Error(`Http error with status code: ${response.status}`);
                }
                const responseData = await response.json();
                updateTaskList('all');
                return responseData;
            
            }
            else{
                console.log("User told not correct");
                confirmationArea.innerHTML = '';
                operation.innerHTML = '';
                task.innerHTML = '';
                urgency.innerHTML = '';
                datetime.innerHTML = '';
                startListening();
            }
        } 
    }
    catch(error){
        console.error("Error processing voice command", error);
        startListening();
        return null;
    }
}


async function getTasksFromDb(userId) {
    try{
        const userData = getUserData();
        if(!userData){
            throw new Error('User not authenticated');
        }
        const response = await fetch(`http://locahost:8080/api/tasks?userId=${userData.userId}`,{
            method : 'GET',
            headers:{
                "Content-type": "applicatoin/json",
                "Accept": "application/json"
            }
        });
        if(response.ok){
            throw new Error(`HTTP error! status:${response.status}`);
        }

        const data = await response.json();
        return data;
    }catch(error){
        console.error("Error fetching tasks", error);
        return new Map();
    }
}

function filterTasks(){
    const filterValue = document.getElementById('dateFilter').value;
    const userData = getUserData();

    if(!userData){
        console.error('USer not authenticated');
        return;
    }

    const url = new URL('http://localhost:8080/api/tasks/filter');
    url.searchParams.append('userId', userData.id);
    if(filterValue!=='all'){
        url.searchParams.append('days', filterValue);
    }

    fetch(url,{
        method: 'GET',
        headers: {
            'Content-Type':'application/json',
            'Accept':'application/json'
        }
    }).then(response =>{
        if(!response.ok){
            throw new Error(`HTTP erroe! status: ${response.status}`);
        }
        return response.json();
    }).then(tasks=>{
        updateTaskListWithFilteredData(task);
    }).catch(error=>{
        console.error('Error fetchiong filtered tasks', error);
        alert('failed to fetch tasks, please try again');
    })
}

function updateTaskListWithFilteredData(task){
    const todoList = document.getElementById("todo-list");
    todoList.innerHTML='';
    if(task.length==0){
        const noTaskMessage = document.createElement("div");
        noTaskMessage.classList.add('no-tasks-message');
        const filterValue = document.getElementById('datrFilter').value;
        noTaskMessage.textContent=filterValue==='all'?'No Task Found':`No Tasks Found in next ${filterValue} days`;
        todoList.appendChild(noTaskMessage);
        return;
    }
    tasks.forEach(taskData =>{
        const listItem = document.createElement("div");
        listItem.classList.add('todo-item');

        const statusIndicator = document.createElement("div"); 
        statusIndicator.classList.add('status-indicator');
        statusIndicator.style.backgroundColor = getUrgencyColor(taskData.urgency);

        const taskContent = document.createElement("div");
        taskContent.classList.add('task-content');
        
        const taskTitle = document.createElement("div");
        taskTitle.classList.add('task-title');
        taskTitle.innerHTML=`
       <span class="operation-badge" style = "background-color:${getUrgencyColor(taskData.urgency)}">${taskData.operation}</span>
       <span class="task-name">${taskData.task}</span>
       `;

       const taskDetails = document.createElement("div");
        taskDetails.classList.add('task-details-line');
        taskTitle.innerHTML=`
       <span class="urgency-badge" style = "background-color:${getUrgencyColor(taskData.urgency)}">${taskData.urgency}</span>
       ${taskData.datetime ? `<span class="dateTime">${taskData.dateTime}</span>` :''}
       `;

       taskContent.appendChild(taskTitle);
       taskContent.appendChild(taskDetails);

       const completeButton = document.createElement("button");
       completeButton.classList.add('complete-btn');
       completeButton.innerHTML='';
       completeButton.textContent='Mark as completed';
       completeButton.onclick= async ()=>{
        try {
            const response = await fetch(`http://localhost:8080/api/tasks/${taskData.id}`,{
                method : 'DELETE',
                headers :{
                    'Content-Type':'application/json',
                    'Accept':'application/json'
                }
            })
            if(!response.ok){
                throw new Error(`Http error status: ${response.status}`);
            }

            filterTasks();
        } catch (error) {
            
        }
       }
    })
}