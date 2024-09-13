const gridSize = 21;  // 21x21 grid to include the axes and cells
const cellSize = 30;  // size of each cell in pixels
const robotSize = 3;  // robot occupies a 3x3 grid area
const animationDuration = 500; // Duration of each movement animation in milliseconds

let currentStep = 0;
let commandList = [];
let obstacles = [];
let obstacleId = 0;
let robotPath = [];
let isAnimating = false; // Flag to track if an animation is in progress

// Initialize the grid and context
const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');

// Draw grid and number the sides
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#000000'; // Ensure numbering is always in black
    ctx.font = '15px Arial';

    for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, gridSize * cellSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(gridSize * cellSize, i * cellSize);
        ctx.stroke();

        // Number the grid, starting from the bottom left corner
        if (i != 0) {
            ctx.fillText(i - 1, i * cellSize + 7.5, gridSize * cellSize - 10);
            ctx.fillText(i - 1, 7.5, gridSize * cellSize - i * cellSize - 10);
        }
    }
}

// Draw the robot's current position
function drawRobot(x, y, direction, isSnap = false) {
    ctx.fillStyle = 'green';
    ctx.fillRect(x * cellSize, (gridSize - y - robotSize) * cellSize, robotSize * cellSize, robotSize * cellSize);

    // Change the front color based on the "SNAP" command
    ctx.fillStyle = isSnap ? 'orange' : 'yellow';

    // Calculate head position based on direction and current position 
    let headX, headY;
    if (direction === 0) { // Facing North
        headX = x + 1;
        headY = y + 2;
    } else if (direction === 2) { // Facing East
        headX = x + 2;
        headY = y + 1;
    } else if (direction === 4) { // Facing South
        headX = x + 1;
        headY = y;
    } else if (direction === 6) { // Facing West
        headX = x;
        headY = y + 1;
    }

    ctx.fillRect(headX * cellSize, (gridSize - headY - 1) * cellSize, cellSize, cellSize);
}

// Function to update the robot's current position and direction display
function updateRobotPosition(x, y, direction) {
    const directionMap = {
        0: 'North',
        2: 'East',
        4: 'South',
        6: 'West'
    };
    const positionDiv = document.getElementById('robot-position');
    positionDiv.textContent = `Position: (x: ${x}, y: ${y}), Direction: ${directionMap[direction]}`;
}

// Draw obstacles
function drawObstacles(obstacles) {
    obstacles.forEach(ob => {
        ctx.fillStyle = 'blue';
        ctx.fillRect((ob.x + 1) * cellSize, (gridSize - ob.y - 2) * cellSize, cellSize, cellSize);
        drawDirectionArrow(ob.x + 1, gridSize - ob.y - 2, ob.d);
    });
}

// Function to draw arrow indicating obstacle direction
function drawDirectionArrow(x, y, direction) {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    if (direction === 0) { 
        ctx.moveTo(x * cellSize + cellSize / 2, y * cellSize);
        ctx.lineTo(x * cellSize + cellSize / 4, y * cellSize + cellSize / 2);
        ctx.lineTo(x * cellSize + 3 * cellSize / 4, y * cellSize + cellSize / 2);
    } else if (direction === 2) { 
        ctx.moveTo(x * cellSize + cellSize, y * cellSize + cellSize / 2);
        ctx.lineTo(x * cellSize + cellSize / 2, y * cellSize + cellSize / 4);
        ctx.lineTo(x * cellSize + cellSize / 2, y * cellSize + 3 * cellSize / 4);
    } else if (direction === 4) { 
        ctx.moveTo(x * cellSize + cellSize / 2, y * cellSize + cellSize);
        ctx.lineTo(x * cellSize + cellSize / 4, y * cellSize + cellSize / 2);
        ctx.lineTo(x * cellSize + 3 * cellSize / 4, y * cellSize + cellSize / 2);
    } else if (direction === 6) { 
        ctx.moveTo(x * cellSize, y * cellSize + cellSize / 2);
        ctx.lineTo(x * cellSize + cellSize / 2, y * cellSize + cellSize / 4);
        ctx.lineTo(x * cellSize + cellSize / 2, y * cellSize + 3 * cellSize / 4);
    }
    ctx.closePath();
    ctx.fill();
}

// Function to update the grid with the robot's path
function updateGrid(data) {
    const path = data.path;
    console.log(path);
    drawGrid();
    drawObstacles(obstacles);
    drawRobot(path[0].x, path[0].y, path[0].d);

    commandList = data.commands;

    // Display commands in the commands div
    const commandsDiv = document.getElementById('commands');
    commandsDiv.innerHTML = '';
    commandList.forEach((command, index) => {
        const commandItem = document.createElement('div');
        commandItem.classList.add('command-item');
        commandItem.textContent = command;
        commandItem.setAttribute('data-index', index);
        commandsDiv.appendChild(commandItem);
    });

    currentStep = 0;
}

// Function to smoothly animate the robot's movement with non-linear turning
async function animateRobotMovement(startX, startY, endX, endY, startDirection, endDirection) {
    isAnimating = true;
    const startTime = performance.now();

    const animate = (currentTime) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / animationDuration, 1); // Ensure progress doesn't exceed 1

        // Calculate the robot's intermediate position using linear interpolation
        const currentX = startX + (endX - startX) * progress;
        const currentY = startY + (endY - startY) * progress;

        // Calculate intermediate direction using easing function for smoother turns
        let currentDirection = startDirection;
        if (startDirection !== endDirection) {
            // Apply easing function (easeInOutQuad in this example)
            const easedProgress = easeInOutQuad(progress); 
            const directionDiff = (endDirection - startDirection + 8) % 8; // Handle direction wrapping
            currentDirection = (startDirection + directionDiff * easedProgress) % 8;
        }

        drawGrid();
        drawObstacles(obstacles);
        drawRobot(currentX, currentY, currentDirection); 

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isAnimating = false;
            // Update the robot's current position and direction display after animation completes
            updateRobotPosition(endX, endY, endDirection);
        }
    };

    requestAnimationFrame(animate);
}

// Easing function: easeInOutQuad (example, you can use others)
function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Step through each command when "Step by Step" button is clicked
document.getElementById('step-button').addEventListener('click', async () => {
    if (isAnimating) return; // Don't start a new animation if one is already in progress

    if (currentStep < commandList.length) {
        
        // Highlight the current command
        const commandsDiv = document.getElementById('commands');
        const currentCommand = commandsDiv.querySelector(`[data-index="${currentStep}"]`);
        if (currentCommand) {
            currentCommand.style.fontWeight = 'bold';
            currentCommand.style.color = 'black';
        }

        // Grey out the previous command
        if (currentStep > 0) {
            const previousCommand = commandsDiv.querySelector(`[data-index="${currentStep - 1}"]`);
            if (previousCommand) {
                previousCommand.style.color = 'grey';
                previousCommand.style.fontWeight = 'normal';
            }
        }

        // Determine if the current command is "SNAP"
        const isSnap = currentCommand.innerHTML.startsWith("SNAP");
        console.log("currentCommand = " + currentCommand.innerHTML);
        if (isSnap) {
            robotPath.splice(currentStep + 1, 0, { ...robotPath[currentStep] });
            console.log(robotPath);
        }
        
        // Get the starting and ending positions and directions for the animation
        const startX = robotPath[currentStep].x;
        const startY = robotPath[currentStep].y;
        const startDirection = robotPath[currentStep].d;

        currentStep++;

        const endX = robotPath[currentStep].x;
        const endY = robotPath[currentStep].y;
        const endDirection = robotPath[currentStep].d;

        // If the command is SNAP, draw the robot again (after animation) with the orange front
        if (isSnap) {
            drawGrid(); 
            drawObstacles(obstacles);
            drawRobot(endX, endY, endDirection, true); 
        } else {
            // Animate the robot's movement
            await animateRobotMovement(startX, startY, endX, endY, startDirection, endDirection); 
        }

    }
});


// Add event listener for the "Add Obstacle" button
document.getElementById('addObstacle').addEventListener('click', () => {
    const x = parseInt(document.getElementById('xCoord').value);
    const y = parseInt(document.getElementById('yCoord').value);
    const direction = document.getElementById('direction').value;
    

    if (isNaN(x) || isNaN(y) || direction === "") {
        alert("Please fill in all fields correctly.");
        return;
    }

    if (x < 0 || x > 19 || y < 0 || y > 19) {
        alert("X and Y coordinates must be between 0 and 19.");
        return;
    }

    let oid = obstacleId;
    obstacleId++;

    // Convert direction to numerical value
    let dirNum;
    if (direction === "north") dirNum = 0;
    else if (direction === "east") dirNum = 2;
    else if (direction === "south") dirNum = 4;
    else if (direction === "west") dirNum = 6;

    // Add the new obstacle to the list
    obstacles.push({ x: x, y: y, d: dirNum, id: oid });
    console.log("xCoord = " + x + ", yCoord = " + y + ", direction = " + direction + ", id = " + oid);

    // Redraw the grid with the new obstacle
    drawGrid();
    drawObstacles(obstacles);
});

// Add event listener for the "Get Pathfinding Results" button
document.getElementById('get-results').addEventListener('click', async () => {
    try {
        const response = await fetch('/path', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                obstacles: obstacles,
                retrying: false,
                robot_x: 1,
                robot_y: 1,
                robot_dir: 0
            })
        });
        console.log(JSON.stringify({
            obstacles: obstacles,
            retrying: false,
            robot_x: 1,
            robot_y: 1,
            robot_dir: 0
        }));
        const result = await response.json();

        if (result.data && result.data.path && result.data.commands) {
            updateGrid(result.data);
            robotPath = result.data.path;
            
            // Update the robot's current position and direction display
            updateRobotPosition(robotPath[currentStep].x, robotPath[currentStep].y, robotPath[currentStep].d);
        }
    } catch (error) {
        console.error("Error fetching pathfinding results:", error);
    }
});

// Initialize the grid on page load
drawGrid();