const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');

const BACKLOG_PATH = path.join(__dirname, 'BACKLOG.md');
const CONFIG_PATH = path.join(__dirname, 'backlog-config.json');
const DEFAULT_PORT = parseInt(process.env.PORT || process.argv[2] || '3030', 10);

// ── Port auto-detection ──────────────────────────────────────────────────────
function findFreePort(startPort) {
    return new Promise((resolve, reject) => {
        function tryPort(port) {
            if (port > startPort + 20) {
                reject(new Error(`No free port found between ${startPort} and ${port - 1}`));
                return;
            }
            const tester = net.createServer();
            tester.once('error', () => tryPort(port + 1));
            tester.once('listening', () => {
                tester.close(() => resolve(port));
            });
            tester.listen(port);
        }
        tryPort(startPort);
    });
}

// ── Config ───────────────────────────────────────────────────────────────────
function getConfig() {
    if (fs.existsSync(CONFIG_PATH)) {
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
    return {
        columns: [
            { id: 'backlog', title: '📥 BACKLOG' },
            { id: 'todo', title: '📋 TO DO' },
            { id: 'in-progress', title: '🚧 IN PROGRESS' },
            { id: 'done', title: '✅ DONE' }
        ],
        assignees: ['Fullstack Developer', 'Frontend Developer', 'Backend Developer', 'Designer', 'DevOps', 'QA', 'Product Manager', 'Data Engineer'],
        types: ['Feature', 'Bug', 'Refactor', 'Task', 'Research'],
        priorities: ['Low', 'Moderate', 'High', 'Critical'],
        epics: ['Frontend', 'Backend', 'Infrastructure', 'Design', 'Analytics', 'Authentication', 'Payments', 'Performance', 'Security', 'General']
    };
}

function saveConfig(config) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

// ── Backlog Parser ───────────────────────────────────────────────────────────
function parseBacklog() {
    const config = getConfig();
    if (!fs.existsSync(BACKLOG_PATH)) return [];

    const content = fs.readFileSync(BACKLOG_PATH, 'utf8');
    const tasks = [];
    const lines = content.split('\n');
    let currentSection = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('### ')) {
            const sectionTitle = line.trim();
            const col = config.columns.find(c =>
                sectionTitle.includes(c.title.replace(/[^\w\s]/g, '').trim()) ||
                sectionTitle.includes(c.id.toUpperCase())
            );
            if (col) currentSection = col.id;
            continue;
        }

        const taskMatch = line.match(
            /^[-*]\s+(\*\*)?\[([ x])\]\s*\[ID:\s*(.*?)\]\s*\[P:\s*(.*?)\]\s*\[A:\s*(.*?)\]\s*\[E:\s*(.*?)\]\s*\[T:\s*(.*?)\](?:\s*\[STATUS:\s*(.*?)\])?\s*(.*?)\s*(\*\*)?$/
        );

        if (taskMatch && currentSection) {
            const isDone = taskMatch[2] === 'x';
            const id = taskMatch[3];
            const priority = taskMatch[4];
            const assignee = taskMatch[5];
            const epic = taskMatch[6];
            const type = taskMatch[7];
            const status_tag = taskMatch[8] || '';
            const title = taskMatch[9].trim();

            const task = {
                id: id.startsWith('#') ? id.substring(1) : id,
                title,
                status: currentSection,
                priority,
                assignee,
                epic,
                type,
                readyStatus: status_tag,
                spec: ''
            };

            let j = i + 1;
            while (j < lines.length) {
                const nextLine = lines[j].trim();
                const isColumnHeader = nextLine.startsWith('### ') &&
                    config.columns.some(c =>
                        nextLine.includes(c.title.replace(/[^\w\s]/g, '').trim()) ||
                        nextLine.includes(c.id.toUpperCase())
                    );

                if (nextLine.match(/^[-*]\s+(\*\*)?\[([ x])\]/) || isColumnHeader || nextLine === '---') {
                    break;
                }

                if (lines[j].trim() || lines[j].startsWith('  ') || lines[j].startsWith('\t')) {
                    task.spec += lines[j] + '\n';
                }
                j++;
            }
            i = j - 1;
            tasks.push(task);
        }
    }
    return tasks;
}

// ── Backlog Writer ───────────────────────────────────────────────────────────
function saveBacklog(taskArray) {
    const config = getConfig();
    const originalContent = fs.readFileSync(BACKLOG_PATH, 'utf8');
    const styleGuideHeader = originalContent.split('## 🛠️ ACTIVE BACKLOG')[0];

    let content = styleGuideHeader + '## 🛠️ ACTIVE BACKLOG\n\n';

    config.columns.forEach(sec => {
        content += `### ${sec.title}\n`;
        const filteredTasks = taskArray.filter(t => t.status === sec.id);

        filteredTasks.forEach(t => {
            const check = t.status === 'done' ? 'x' : ' ';
            const boldStr = t.status !== 'done' ? '**' : '';

            const statusTag = t.readyStatus && t.readyStatus.trim() ? ` [STATUS: ${t.readyStatus.trim()}]` : '';
            const idStr = t.id.startsWith('#') ? t.id : `#${t.id}`;

            content += `- ${boldStr}[${check}] [ID: ${idStr}] [P: ${t.priority}] [A: ${t.assignee}] [E: ${t.epic}] [T: ${t.type}]${statusTag} ${t.title}${boldStr}\n`;

            if (t.spec && t.spec.trim()) {
                content += t.spec.endsWith('\n') ? t.spec : t.spec + '\n';
            }
        });
        content += '\n';
    });

    fs.writeFileSync(BACKLOG_PATH, content, 'utf8');
}

// ── File Uploads ─────────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.ogv': 'video/ogg'
};

// ── HTTP Server ──────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/api/tasks' && req.method === 'GET') {
        try {
            const tasks = parseBacklog();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(tasks));
        } catch (err) {
            res.writeHead(500);
            res.end(err.message);
        }
    } else if (req.url === '/api/tasks' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const tasks = JSON.parse(body);
                saveBacklog(tasks);
                res.writeHead(200);
                res.end('Saved');
            } catch (err) {
                res.writeHead(500);
                res.end(err.message);
            }
        });
    } else if (req.url === '/api/config' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getConfig()));
    } else if (req.url === '/api/config' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const config = JSON.parse(body);
                saveConfig(config);
                res.writeHead(200);
                res.end('Config Saved');
            } catch (err) {
                res.writeHead(500);
                res.end(err.message);
            }
        });
    } else if (req.url === '/api/upload' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const { fileName, mimeType, base64Data } = JSON.parse(body);
                if (!base64Data || !mimeType) {
                    res.writeHead(400);
                    return res.end('Missing base64Data or mimeType');
                }

                const ext = path.extname(fileName || '') ||
                    (mimeType.includes('png') ? '.png' :
                        mimeType.includes('jpeg') || mimeType.includes('jpg') ? '.jpg' :
                            mimeType.includes('mp4') ? '.mp4' : '.bin');
                const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
                const uniqueName = `attach-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${safeExt}`;
                const targetPath = path.join(UPLOADS_DIR, uniqueName);

                const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
                const buffer = Buffer.from(cleanBase64, 'base64');

                fs.writeFileSync(targetPath, buffer);

                const isVideo = mimeType.startsWith('video/') || ['.mp4', '.webm', '.mov', '.ogv'].includes(safeExt);
                const fileUrl = `/uploads/${uniqueName}`;

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ url: fileUrl, name: fileName || uniqueName, type: isVideo ? 'video' : 'image' }));
            } catch (err) {
                res.writeHead(500);
                res.end(err.message);
            }
        });
    } else {
        let reqUrl = req.url;
        try { reqUrl = decodeURIComponent(reqUrl); } catch (e) { }
        let filePath = reqUrl === '/' ? '/index.html' : reqUrl;
        const basePath = path.join(__dirname, 'public');
        const fullPath = path.resolve(path.join(basePath, filePath));

        if (!fullPath.startsWith(basePath + path.sep) && fullPath !== basePath) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            const content = fs.readFileSync(fullPath);
            const ext = path.extname(fullPath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
    }
});

// ── Start ─────────────────────────────────────────────────────────────────────
findFreePort(DEFAULT_PORT).then(port => {
    server.listen(port, () => {
        const projectName = path.basename(path.resolve(__dirname, '..', '..'));
        console.log(`\n🗂  Backlog Server — ${projectName}`);
        console.log(`   ➜  http://localhost:${port}\n`);
    });
}).catch(err => {
    console.error('Could not start backlog server:', err.message);
    process.exit(1);
});

module.exports = { parseBacklog, saveBacklog };
