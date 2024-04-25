// TASK: import helper functions from utils
import { getTasks, createNewTask, patchTask, deleteTask } from './utils/taskFunctions.js';
// TASK: import initialData
import { initialData } from './initialData.js';

// Function checks if local storage already has data, if not it loads initialData to localStorage
function initializeData() {
  if (!localStorage.getItem('tasks')) {
    localStorage.setItem('tasks', JSON.stringify(initialData)); 
    localStorage.setItem('showSideBar', 'true');
  } else {
    console.log('Data already exists in localStorage');
  }
}

initializeData();

// TASK: Get elements from the DOM
const elements = {
  // Navigation Sidebar elements
  sideBar: document.querySelector('.side-bar'),
  logo: document.getElementById('logo'),
  boardsNavLinks: document.getElementById('boards-nav-links-div'),
  toggleSwitch: document.getElementById('switch'),
  hideSideBarBtn: document.getElementById('hide-side-bar-btn'),
  showSideBarBtn: document.getElementById('show-side-bar-btn'),

  // Main Layout elements
  layout: document.getElementById('layout'),
  header: document.getElementById('header'),
  headerBoardName: document.getElementById('header-board-name'),
  addNewTaskBtn: document.getElementById('add-new-task-btn'),
  editBoardBtn: document.getElementById('edit-board-btn'),
  deleteBoardBtn: document.getElementById('deleteBoardBtn'),

  // Task Columns elements
  todoColumn: document.querySelector('[data-status="todo"]'),
  doingColumn: document.querySelector('[data-status="doing"]'),
  doneColumn: document.querySelector('[data-status="done"]'),

  // New Task Modal elements
  newTaskModalWindow: document.getElementById('new-task-modal-window'),
  titleInput: document.getElementById('title-input'),
  descInput: document.getElementById('desc-input'),
  selectStatus: document.getElementById('select-status'),
  createTaskBtn: document.getElementById('create-task-btn'),
  cancelAddTaskBtn: document.getElementById('cancel-add-task-btn'),

  // Edit Task Modal elements
  editTaskModalWindow: document.querySelector('.edit-task-modal-window'),
  editTaskTitleInput: document.getElementById('edit-task-title-input'),
  editTaskDescInput: document.getElementById('edit-task-desc-input'),
  editSelectStatus: document.getElementById('edit-select-status'),
  saveTaskChangesBtn: document.getElementById('save-task-changes-btn'),
  cancelEditBtn: document.getElementById('cancel-edit-btn'),
  deleteTaskBtn: document.getElementById('delete-task-btn'),

  // Filter Div
  filterDiv: document.getElementById('filterDiv')
};

let activeBoard = "";

// Extracts unique board names from tasks
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks();
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))];
  displayBoards(boards);
  if (boards.length > 0) {
    const localStorageBoard = JSON.parse(localStorage.getItem("activeBoard"));
    activeBoard = localStorageBoard ? localStorageBoard :  boards[0]; 
    elements.headerBoardName.textContent = activeBoard;
    styleActiveBoard(activeBoard);
    refreshTasksUI();
  }
}

// Creates different boards in the DOM
function displayBoards(boards) {
  const boardsContainer = document.getElementById("boards-nav-links-div");
  boardsContainer.innerHTML = ''; // Clears the container
  boards.forEach(board => {
    const boardElement = document.createElement("button");
    boardElement.textContent = board;
    boardElement.classList.add("board-btn");
    boardElement.addEventListener('click', () =>  { 
      elements.headerBoardName.textContent = board;
      filterAndDisplayTasksByBoard(board);
      activeBoard = board; //assigns active board
      localStorage.setItem("activeBoard", JSON.stringify(activeBoard));
      styleActiveBoard(activeBoard);
    });
    boardsContainer.appendChild(boardElement);

    // Create columns for each status if they don't exist
    const columnDivs = [elements.todoColumn, elements.doingColumn, elements.doneColumn];
    columnDivs.forEach(column => {
      const status = column.getAttribute("data-status");
      if (!document.querySelector(`[data-status="${status}"]`)) {
        const newColumn = document.createElement("div");
        newColumn.classList.add("column");
        newColumn.setAttribute("data-status", status);
        newColumn.innerHTML = `<div class="column-head-div">
                                  <span class="dot" id="${status}-dot"></span>
                                  <h4 class="columnHeader">${status.toUpperCase()}</h4>
                                </div>`;
        boardsContainer.appendChild(newColumn);
      }
    });
  });
}

// Filters tasks corresponding to the board name and displays them on the DOM.
function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks(); // Fetch tasks from a simulated local storage function
  const filteredTasks = tasks.filter(task => task.board === boardName);

  const columnDivs = [elements.todoColumn, elements.doingColumn, elements.doneColumn];
  columnDivs.forEach(column => {
    const status = column.getAttribute("data-status");
    // Reset column content while preserving the column title
    column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`;

    const tasksContainer = document.createElement("div");
    column.appendChild(tasksContainer);

    filteredTasks.filter(task => task.status === status).forEach(task => { 
      const taskElement = document.createElement("div");
      taskElement.classList.add("task-div");
      taskElement.textContent = task.title;
      taskElement.setAttribute('data-task-id', task.id);

      // Add click event listener to the task element
      taskElement.addEventListener('click', () => { 
        openEditTaskModal(task); // Open edit task modal when task is clicked
      });

      tasksContainer.appendChild(taskElement);
    });
  });
}

function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
}

// Styles the active board by adding an active class
function styleActiveBoard(boardName) {
  document.querySelectorAll('.board-btn').forEach(btn => { //forEach instead of foreach
    if (btn.textContent === boardName) {
      btn.classList.add('active'); 
    } else {
      btn.classList.remove('active'); // Used classList.add() and classList.remove() 
    }
  });
}

function addTaskToUI(task) {
  const column = document.querySelector(`.column[data-status="${task.status}"]`); // ` not ' for template literal, as seen below
  if (!column) {
    console.error(`Column not found for status: ${task.status}`);
    return;
  }

  let tasksContainer = column.querySelector('.tasks-container');
  if (!tasksContainer) {
    console.warn(`Tasks container not found for status: ${task.status}, creating one.`);
    tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container';
    column.appendChild(tasksContainer);
  }

  const taskElement = document.createElement('div');
  taskElement.className = 'task-div';
  taskElement.textContent = task.title; // Modify as needed         THIS???
  taskElement.setAttribute('data-task-id', task.id);

  tasksContainer.appendChild(taskElement);
}

function setupEventListeners() {
  // Cancel editing task event listener
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  cancelEditBtn.addEventListener('click', () => toggleModal(false, elements.editTaskModalWindow));

  // Cancel adding new task event listener
  const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn');
  cancelAddTaskBtn.addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none'; 
  });

  // Clicking outside the modal to close it
  elements.filterDiv.addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none'; 
  });

  // Show sidebar event listener
  elements.hideSideBarBtn.addEventListener('click', () => toggleSidebar(false));
  elements.showSideBarBtn.addEventListener('click', () => toggleSidebar(true));

  // Theme switch event listener
  elements.toggleSwitch.addEventListener('change', toggleTheme);

  // Show Add New Task Modal event listener
  elements.addNewTaskBtn.addEventListener('click', () => {
    toggleModal(true);
    elements.filterDiv.style.display = 'block'; // Also show the filter overlay
  });

  // Add new task form submission event listener
  elements.newTaskModalWindow.addEventListener('submit', event => {
    addTask(event);
  });

  // Save task changes event listener
  elements.saveTaskChangesBtn.addEventListener('click', () => {
    const taskId = elements.editTaskModalWindow.getAttribute('data-task-id');
    deleteTask(taskId);
    toggleModal(false, elements.editTaskModalWindow);
    refreshTasksUI();
  });
}

  // Delete task event listener
  elements.deleteTaskBtn.addEventListener('click', () => {
    const taskId = elements.editTaskModalWindow.getAttribute('data-task-id');
    deleteTask(taskId);
    toggleModal(false, elements.editTaskModalWindow);
    refreshTasksUI();
  });

// Toggles tasks modal
function toggleModal(show, modal = elements.newTaskModalWindow) {
  modal.style.display = show ? 'block' : 'none'; 
}

/*************************************************************************************************************************************************
 * COMPLETE FUNCTION CODE
 * **********************************************************************************************************************************************/

function addTask(event) {
  event.preventDefault(); 

  //Assign user input to the task object
  const task = {
    title: elements.titleInput.value,
    description: elements.descInput.value,
    status: elements.selectStatus.value,
    board: activeBoard
  };
  const newTask = createNewTask(task);
  if (newTask) {
    addTaskToUI(newTask);
    saveUpdatedTaskToLocalStorage(newTask); // Save the new task to local storage
    toggleModal(false);
    elements.filterDiv.style.display = 'none';     //THIS?
    event.target.reset();
    refreshTasksUI();
  }
}

function toggleSidebar(show) {
  const sidebar = document.querySelector('.side-bar');
  const sideBarBottom = document.querySelector('.side-bar-bottom'); // Selecting the .side-bar-bottom element

  if (show) {
    sidebar.style.display = 'block';
    svg.style.display = 'none';
    // Adjust the margin-top or padding-top to move the side-bar-bottom
    sideBarBottom.style.marginTop = '300px'; // Example value, adjust as needed
  } else {
    sidebar.style.display = 'none';
    svg.style.display = 'block';
    // Reset the margin-top or padding-top when hiding the sidebar
    sideBarBottom.style.marginTop = '0'; // Example value, adjust as needed
  }
  console.log(sidebar);
}

function toggleTheme() {
  const body = document.body;
  const logo = document.getElementById('logo');
  
  if (body.classList.contains('light-theme')) {
    body.classList.remove('light-theme');
    body.classList.add('dark-theme');
    
    localStorage.setItem('theme', 'dark');
  } else {
    body.classList.remove('dark-theme');
    body.classList.add('light-theme');
   
    localStorage.setItem('theme', 'light');
    logo.style.filter = 'invert(100%)';
  }
}

// Inside openEditTaskModal function

function openEditTaskModal(task) {
  // Set task details in modal inputs
  elements.editTaskTitleInput.value = task.title;
  elements.editTaskDescInput.value = task.description;
  elements.editSelectStatus.value = task.status;

  // Show the edit task modal
  toggleModal(true, elements.editTaskModalWindow);

  // Remove any previous event listener before adding a new one
  elements.saveTaskChangesBtn.removeEventListener('click', saveTaskChanges);
  
 // Function to handle "Save Changes" button click in the edit task modal
elements.saveTaskChangesBtn.addEventListener('click', () => {
  const taskId = elements.editTaskModalWindow.getAttribute('data-task-id'); // Get taskId from data attribute
  saveTaskChanges(taskId); // Pass taskId to saveTaskChanges function
  toggleModal(false, elements.editTaskModalWindow);
  refreshTasksUI();
});


  // Add event listener to delete button to delete the task
  elements.deleteTaskBtn.addEventListener('click', () => {
    deleteTask(task.id);
    toggleModal(false, elements.editTaskModalWindow);
    refreshTasksUI();
  });
}
// Inside saveTaskChanges function

function saveTaskChanges(taskId) {
  // Get new user inputs
  const updatedTitle = elements.editTaskTitleInput.value;
  const updatedDescription = elements.editTaskDescInput.value;
  const updatedStatus = elements.editSelectStatus.value;

  // Create an object with the updated task details
  const updatedTask = {
    id: taskId,
    title: updatedTitle,
    description: updatedDescription,
    status: updatedStatus
  };

  // Update task using a helper function
  patchTask(updatedTask); 
  saveUpdatedTaskToLocalStorage(updatedTask); // Save the updated task to local storage

  // Close the modal
  toggleModal(false, elements.editTaskModalWindow);

  // Refresh the UI to reflect the changes
  refreshTasksUI();
}

// Function to save updated task details to localStorage
function saveUpdatedTaskToLocalStorage(updatedTask) {
  // Retrieve existing tasks from localStorage
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];

  // Find the index of the task to update
  const taskIndex = tasks.findIndex(task => task.id === updatedTask.id);

  // If the task exists, update it; otherwise, add it as a new task
  if (taskIndex !== -1) {
    tasks[taskIndex] = updatedTask;
  } else {
    tasks.push(updatedTask);
  }

  // Save the updated tasks back to localStorage
  localStorage.setItem('tasks', JSON.stringify(tasks));
}


// Create an SVG element
const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("width", "50"); 
svg.setAttribute("height", "40"); 
svg.style.border = "none"; 
svg.style.zIndex = "2"; 
svg.style.position = "absolute"; 
svg.style.bottom = "45px"; 
svg.style.borderRadius = "0 20px 20px 0"; 
svg.style.backgroundColor = "#219C90"; 
svg.style.display = "none"; 
svg.style.cursor = "pointer"; 

// Create a text element inside the SVG for the eye emoji
const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
text.setAttribute("x", "17");
text.setAttribute("y", "23");
text.setAttribute("font-size", "14");
text.setAttribute("fill", "#828FA3");
text.textContent = "👀";

// Append the text element to the SVG
svg.appendChild(text);

// Get the layout container
const layout = document.getElementById("layout");

// Append the SVG to the layout container
layout.appendChild(svg);
svg.style.marginTop = "130px";

// Add an event listener to the SVG to toggle the sidebar when clicked
svg.addEventListener("click", function() {
  toggleSidebar(true); // Open the sidebar when clicked
  svg.style.display = "none";
});



/*************************************************************************************************************************************************/

document.addEventListener('DOMContentLoaded', function() {
  init(); // init is called after the DOM is fully loaded
});

function init() {
  setupEventListeners();
  const showSidebar = localStorage.getItem('showSideBar') === 'false';
  toggleSidebar(showSidebar);
  const isLightTheme = localStorage.getItem('theme') === 'light';
  document.body.classList.toggle('light-theme', isLightTheme);
  fetchAndDisplayBoardsAndTasks(); // Initial display of boards and tasks
}