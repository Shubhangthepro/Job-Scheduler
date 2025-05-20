// ==================== DSA: MaxHeap for Priority Queue ====================
class MaxHeap {
  constructor() {
    this.heap = [];
  }

  insert(job) {
    this.heap.push(job);
    this._heapifyUp(this.heap.length - 1);
  }

  extractMax() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const max = this.heap[0];
    this.heap[0] = this.heap.pop();
    this._heapifyDown(0);
    return max;
  }

  _heapifyUp(index) {
    while (
      index > 0 &&
      this.heap[index].profit > this.heap[this._parent(index)].profit
    ) {
      this._swap(index, this._parent(index));
      index = this._parent(index);
    }
  }

  _heapifyDown(index) {
    let largest = index;
    const left = this._left(index);
    const right = this._right(index);

    if (
      left < this.heap.length &&
      this.heap[left].profit > this.heap[largest].profit
    ) {
      largest = left;
    }

    if (
      right < this.heap.length &&
      this.heap[right].profit > this.heap[largest].profit
    ) {
      largest = right;
    }

    if (largest !== index) {
      this._swap(index, largest);
      this._heapifyDown(largest);
    }
  }

  _swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  _parent(i) {
    return Math.floor((i - 1) / 2);
  }

  _left(i) {
    return 2 * i + 1;
  }

  _right(i) {
    return 2 * i + 2;
  }

  isEmpty() {
    return this.heap.length === 0;
  }
}

// ==================== Job Scheduler Core ====================
const jobs = [];

document.getElementById("jobForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const id = document.getElementById("jobId").value.trim();
  const deadline = parseInt(document.getElementById("deadline").value);
  const profit = parseInt(document.getElementById("profit").value);

  if (!id || isNaN(deadline) || isNaN(profit)) return;

  jobs.push({ id, deadline, profit });

  document.getElementById("jobForm").reset();
  alert("Job added!");
});

document.getElementById("scheduleBtn").addEventListener("click", () => {
  const result = greedySchedule(jobs);
  displayResult(
    result.scheduledJobs,
    result.totalProfit,
    "Greedy (Max Profit)"
  );
});

document.getElementById("roundRobinBtn")?.addEventListener("click", () => {
  const result = roundRobinSchedule(jobs, 2); // Time quantum = 2
  displayResult(result, null, "Round Robin");
});

// ==================== Greedy Scheduling (Using Heap) ====================
function greedySchedule(jobs) {
  const maxHeap = new MaxHeap();
  for (const job of jobs) maxHeap.insert(job);

  const maxDeadline = Math.max(...jobs.map((j) => j.deadline));
  const timeSlots = Array(maxDeadline).fill(null);
  let totalProfit = 0;

  while (!maxHeap.isEmpty()) {
    const job = maxHeap.extractMax();
    for (let t = job.deadline - 1; t >= 0; t--) {
      if (!timeSlots[t]) {
        timeSlots[t] = job;
        totalProfit += job.profit;
        break;
      }
    }
  }

  const scheduledJobs = timeSlots.filter(Boolean);
  return { scheduledJobs, totalProfit };
}

// ==================== Round-Robin Scheduling ====================
function roundRobinSchedule(jobs, quantum) {
  const jobQueue = jobs.map((j) => ({
    ...j,
    remainingTime: j.profit,
  }));

  const result = [];
  let time = 0;

  while (jobQueue.length > 0) {
    const job = jobQueue.shift();

    const executionTime = Math.min(quantum, job.remainingTime);
    result.push({ id: job.id, executedAt: time, duration: executionTime });
    time += executionTime;

    job.remainingTime -= executionTime;
    if (job.remainingTime > 0) {
      jobQueue.push(job); // requeue
    }
  }

  return result;
}

// ==================== Display Output ====================
function displayResult(scheduledJobs, profit, label) {
  const list = document.getElementById("scheduleList");
  const profitDisplay = document.getElementById("totalProfit");
  const ganttChart = document.getElementById("ganttChart");
  const summaryStats = document.getElementById("summaryStats");

  list.innerHTML = `<strong>${label} Output:</strong><br>`;
  ganttChart.innerHTML = "";
  summaryStats.innerHTML = "";

  if (scheduledJobs.length === 0) {
    list.innerHTML += "<li>No jobs scheduled</li>";
  } else {
    scheduledJobs.forEach((item, index) => {
      const li = document.createElement("li");
      const block = document.createElement("div");
      block.className = "gantt-block";

      const jobId = item.id;
      const color = getColor(jobId);
      block.style.backgroundColor = color;

      if (item.duration) {
        li.textContent = `Job ${jobId} ran from t=${item.executedAt} for ${item.duration} units`;
        block.textContent = jobId;
        block.style.width = `${item.duration * 60}px`;
        const label = document.createElement("span");
        label.textContent = `t=${item.executedAt}`;
        block.appendChild(label);
      } else {
        li.textContent = `Job ${jobId} (Profit: ${item.profit}, Deadline: ${item.deadline})`;
        block.textContent = jobId;
        block.style.width = `60px`;
        const label = document.createElement("span");
        label.textContent = `t=${index}`;
        block.appendChild(label);
      }

      ganttChart.appendChild(block);
      list.appendChild(li);
    });
  }

  if (profit !== null) {
    profitDisplay.textContent = `Total Profit: ₹${profit}`;
    summaryStats.innerHTML = ""; // No extra stats for greedy
  } else {
    profitDisplay.textContent = "";
    const rrStats = calculateRRStats(scheduledJobs);
    summaryStats.innerHTML = `
        <strong>Round-Robin Stats:</strong><br>
        Average Turnaround Time: ${rrStats.avgTurnaround.toFixed(2)} units<br>
        Average Waiting Time: ${rrStats.avgWaiting.toFixed(2)} units
      `;
  }
}

function getColor(jobId) {
  // Simple hash to generate color per job ID
  const hash = jobId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    "#4CAF50",
    "#2196F3",
    "#FF9800",
    "#E91E63",
    "#9C27B0",
    "#00BCD4",
    "#F44336",
    "#795548",
  ];
  return colors[hash % colors.length];
}

const darkToggle = document.getElementById("darkModeToggle");

darkToggle.addEventListener("click", () => {
  const body = document.body;
  body.classList.toggle("dark");

  // Switch icon
  if (body.classList.contains("dark")) {
    darkToggle.textContent = "☀️";
  } else {
    darkToggle.textContent = "🌙";
  }
});

document.getElementById("clearBtn").addEventListener("click", () => {
  jobs.length = 0;
  document.getElementById("scheduleList").innerHTML = "";
  document.getElementById("ganttChart").innerHTML = "";
  document.getElementById("totalProfit").textContent = "";
  document.getElementById("summaryStats").innerHTML = "";
});

function calculateRRStats(schedule) {
  const jobMap = {};
  schedule.forEach(({ id, executedAt, duration }) => {
    if (!jobMap[id]) {
      jobMap[id] = { start: executedAt, end: executedAt + duration };
    } else {
      jobMap[id].end = executedAt + duration;
    }
  });

  const stats = Object.keys(jobMap).map((id) => {
    const job = jobs.find((j) => j.id === id);
    const completion = jobMap[id].end;
    const turnaround = completion; // assume arrival time = 0
    const waiting = turnaround - job.profit;
    return { turnaround, waiting };
  });

  const avgTurnaround =
    stats.reduce((sum, s) => sum + s.turnaround, 0) / stats.length;
  const avgWaiting =
    stats.reduce((sum, s) => sum + s.waiting, 0) / stats.length;
  return { avgTurnaround, avgWaiting };
}
