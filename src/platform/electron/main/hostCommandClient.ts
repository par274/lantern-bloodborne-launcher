import net from 'node:net';

const HOST_PORT_ENV = 'LANTERN_HOST_PORT';
const HOST_TOKEN_ENV = 'LANTERN_HOST_TOKEN';

export function canUseHostCommandChannel(): boolean {
    return !!resolveHostPort() && !!process.env[HOST_TOKEN_ENV];
}

export function resolveHostPort(): number | null {
    const rawPort = process.env[HOST_PORT_ENV];
    const port = rawPort ? Number.parseInt(rawPort, 10) : Number.NaN;

    return Number.isInteger(port) && port > 0 && port <= 65535 ? port : null;
}

export async function connectHostCommandSocket(): Promise<net.Socket> {
    const port = resolveHostPort();

    if (!port || !process.env[HOST_TOKEN_ENV]) {
        throw new Error('Lantern host command channel is not available.');
    }

    const socket = net.createConnection({ host: '127.0.0.1', port });

    await new Promise<void>((resolve, reject) => {
        socket.once('connect', resolve);
        socket.once('error', reject);
    });

    return socket;
}

export async function writeHostCommand(socket: net.Socket, command: string, lines: readonly string[] = []): Promise<void> {
    const token = process.env[HOST_TOKEN_ENV];

    if (!token) {
        throw new Error('Lantern host command token is not available.');
    }

    await new Promise<void>((resolve, reject) => {
        socket.write(`${[token, command, ...lines].join('\n')}\n`, 'utf8', (error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}

export async function sendHostCommand(command: string, lines: readonly string[] = []): Promise<string> {
    const socket = await connectHostCommandSocket();

    try {
        await writeHostCommand(socket, command, lines);
        const response = await readHostProtocolLine(socket);

        if (response.startsWith('error:')) {
            throw new Error(response.slice('error:'.length));
        }

        return response;
    } finally {
        socket.destroy();
    }
}

export function readHostProtocolLine(socket: net.Socket): Promise<string> {
    return new Promise((resolve, reject) => {
        let buffer = '';

        const cleanup = () => {
            socket.removeListener('data', handleData);
            socket.removeListener('error', handleError);
            socket.removeListener('close', handleClose);
        };

        const handleData = (chunk: Buffer) => {
            buffer += chunk.toString('utf8');
            const newlineIndex = buffer.indexOf('\n');

            if (newlineIndex === -1) {
                return;
            }

            cleanup();
            resolve(buffer.slice(0, newlineIndex).trim());
        };

        const handleError = (error: Error) => {
            cleanup();
            reject(error);
        };

        const handleClose = () => {
            cleanup();
            reject(new Error('Lantern host command channel closed before a response was received.'));
        };

        socket.on('data', handleData);
        socket.once('error', handleError);
        socket.once('close', handleClose);
    });
}

export function createHostProtocolLineHandler(
    socket: net.Socket,
    onLine: (line: string) => void,
    onError: (error: Error) => void
): () => void {
    let buffer = '';

    const handleData = (chunk: Buffer) => {
        buffer += chunk.toString('utf8');

        while (true) {
            const newlineIndex = buffer.indexOf('\n');

            if (newlineIndex === -1) {
                return;
            }

            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);
            onLine(line);
        }
    };

    const handleError = (error: Error) => {
        onError(error);
    };

    socket.on('data', handleData);
    socket.once('error', handleError);

    return () => {
        socket.removeListener('data', handleData);
        socket.removeListener('error', handleError);
    };
}
