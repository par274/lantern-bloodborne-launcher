<script lang="ts">
	import { onMount } from 'svelte';

	type SmokeInitResult = {
		cleanup: () => void;
		ready: Promise<void>;
	};

	type Props = {
		onReady?: () => void;
	};

	let { onReady = () => {} }: Props = $props();
	let canvas: HTMLCanvasElement | undefined;

	function createShader(webgl: WebGLRenderingContext, type: number, source: string): WebGLShader {
		const shader = webgl.createShader(type);
		if (!shader) throw new Error('Shader could not be created.');
		webgl.shaderSource(shader, source);
		webgl.compileShader(shader);

		if (!webgl.getShaderParameter(shader, webgl.COMPILE_STATUS)) {
			const log = webgl.getShaderInfoLog(shader) ?? 'Unknown shader error.';
			webgl.deleteShader(shader);
			throw new Error(log);
		}

		return shader;
	}

	function createProgram(webgl: WebGLRenderingContext, vsSource: string, fsSource: string): WebGLProgram {
		const vs = createShader(webgl, webgl.VERTEX_SHADER, vsSource);
		const fs = createShader(webgl, webgl.FRAGMENT_SHADER, fsSource);

		const program = webgl.createProgram();
		if (!program) throw new Error('Program could not be created.');

		webgl.attachShader(program, vs);
		webgl.attachShader(program, fs);
		webgl.linkProgram(program);

		webgl.deleteShader(vs);
		webgl.deleteShader(fs);

		if (!webgl.getProgramParameter(program, webgl.LINK_STATUS)) {
			const log = webgl.getProgramInfoLog(program) ?? 'Unknown link error.';
			webgl.deleteProgram(program);
			throw new Error(log);
		}

		return program;
	}

	function initSmoke(targetCanvas: HTMLCanvasElement): SmokeInitResult {
		let resolveReady = () => {};
		const ready = new Promise<void>((resolve) => {
			resolveReady = resolve;
		});
		let hasResolvedReady = false;

		const markReady = () => {
			if (hasResolvedReady) {
				return;
			}

			hasResolvedReady = true;
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					resolveReady();
				});
			});
		};

		const gl = targetCanvas.getContext('webgl', {
			alpha: true,
			antialias: true,
			premultipliedAlpha: true,
			preserveDrawingBuffer: false
		}) as WebGLRenderingContext | null;

		if (!gl) {
			console.warn('WebGL is not supported.');
			markReady();
			return {
				ready,
				cleanup: () => {}
			};
		}

		const webgl = gl;

		const vertexSource = `
			attribute vec2 a_position;
			varying vec2 v_uv;

			void main() {
				v_uv = a_position * 0.5 + 0.5;
				gl_Position = vec4(a_position, 0.0, 1.0);
			}
		`;

		const fragmentSource = `
			precision mediump float;

			varying vec2 v_uv;

			uniform vec2 u_resolution;
			uniform float u_time;

			float hash(vec2 p) {
				return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
			}

			float noise(vec2 p) {
				vec2 i = floor(p);
				vec2 f = fract(p);

				float a = hash(i);
				float b = hash(i + vec2(1.0, 0.0));
				float c = hash(i + vec2(0.0, 1.0));
				float d = hash(i + vec2(1.0, 1.0));

				vec2 u = f * f * (3.0 - 2.0 * f);

				return mix(a, b, u.x) +
					(c - a) * u.y * (1.0 - u.x) +
					(d - b) * u.x * u.y;
			}

			float fbm(vec2 p) {
				float value = 0.0;
				float amplitude = 0.5;

				for (int i = 0; i < 6; i++) {
					value += amplitude * noise(p);
					p *= 2.0;
					amplitude *= 0.5;
				}

				return value;
			}

			float smokeLayer(vec2 uv, float t, float scale, vec2 drift, float softness) {
				vec2 p = uv * scale;
				p.x += t * drift.x;
				p.y += t * drift.y;

				float n1 = fbm(p + vec2(0.0, t * 0.05));
				float n2 = fbm(p * 1.7 - vec2(t * 0.03, t * 0.04));
				float n = mix(n1, n2, 0.5);

				n = smoothstep(softness, 1.0, n);
				return n;
			}

			void main() {
				vec2 uv = v_uv;
				vec2 centered = uv - 0.5;
				centered.x *= u_resolution.x / u_resolution.y;

				float t = u_time * 0.38;

				float back = smokeLayer(
					uv + vec2(0.0, -0.04),
					t,
					2.6,
					vec2(0.08, -0.02),
					0.48
				);

				float mid = smokeLayer(
					uv + vec2(0.0, 0.08),
					t + 17.0,
					3.7,
					vec2(-0.12, -0.03),
					0.52
				);

				float floorMist = smokeLayer(
					uv + vec2(0.0, 0.34),
					t + 41.0,
					5.2,
					vec2(0.18, -0.01),
					0.50
				);

				float verticalMask = smoothstep(1.08, 0.22, uv.y);
				float floorMask = smoothstep(1.0, 0.58, uv.y);

				float centerGlow = exp(-dot(centered * vec2(1.15, 1.8), centered * vec2(1.15, 1.8)) * 3.8);
				float centerFog = exp(-dot(centered * vec2(1.0, 1.5), centered * vec2(1.0, 1.5)) * 2.2);

				float density =
					back * 0.34 * verticalMask +
					mid * 0.46 * verticalMask +
					floorMist * 0.44 * floorMask;

				density += centerGlow * 0.08;

				density = clamp(density, 0.0, 0.72);
				density += centerFog * 0.22;

				vec3 smokeColor = mix(
					vec3(0.55, 0.60, 0.63),
					vec3(0.88, 0.91, 0.94),
					clamp(density * 2.8, 0.0, 1.0)
				);

				gl_FragColor = vec4(smokeColor, density);
			}
		`;

		let program: WebGLProgram;
		try {
			program = createProgram(webgl, vertexSource, fragmentSource);
		} catch (err) {
			console.error(err);
			markReady();
			return {
				ready,
				cleanup: () => {}
			};
		}

		const positionBuffer = webgl.createBuffer();
		webgl.bindBuffer(webgl.ARRAY_BUFFER, positionBuffer);
		webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), webgl.STATIC_DRAW);

		const positionLocation = webgl.getAttribLocation(program, 'a_position');
		const timeLocation = webgl.getUniformLocation(program, 'u_time');
		const resolutionLocation = webgl.getUniformLocation(program, 'u_resolution');

		webgl.enable(webgl.BLEND);
		webgl.blendFunc(webgl.SRC_ALPHA, webgl.ONE_MINUS_SRC_ALPHA);

		function resize() {
			const dpr = Math.min(window.devicePixelRatio || 1, 1.15);
			const scale = 0.78;

			const width = Math.floor(targetCanvas.clientWidth * dpr * scale);
			const height = Math.floor(targetCanvas.clientHeight * dpr * scale);

			if (targetCanvas.width !== width || targetCanvas.height !== height) {
				targetCanvas.width = width;
				targetCanvas.height = height;
			}

			webgl.viewport(0, 0, targetCanvas.width, targetCanvas.height);
		}

		let raf = 0;
		const start = performance.now();

		let lastFrame = 0;
		const targetFrameMs = 1000 / 45;

		function render(now = 0) {
			if (now - lastFrame < targetFrameMs) {
				raf = requestAnimationFrame(render);
				return;
			}

			lastFrame = now;

			resize();

			webgl.clearColor(0, 0, 0, 0);
			webgl.clear(webgl.COLOR_BUFFER_BIT);

			webgl.useProgram(program);

			webgl.bindBuffer(webgl.ARRAY_BUFFER, positionBuffer);
			webgl.enableVertexAttribArray(positionLocation);
			webgl.vertexAttribPointer(positionLocation, 2, webgl.FLOAT, false, 0, 0);

			const time = (performance.now() - start) * 0.001;

			webgl.uniform1f(timeLocation, time);
			webgl.uniform2f(resolutionLocation, targetCanvas.width, targetCanvas.height);

			webgl.drawArrays(webgl.TRIANGLES, 0, 6);
			markReady();

			raf = requestAnimationFrame(render);
		}

		const ro = new ResizeObserver(() => resize());
		ro.observe(targetCanvas);

		render();

		return {
			ready,
			cleanup: () => {
				cancelAnimationFrame(raf);
				ro.disconnect();

				webgl.deleteBuffer(positionBuffer);
				webgl.deleteProgram(program);
			}
		};
	}

	onMount(() => {
		if (!canvas) {
			onReady();
			return;
		}

		const smoke = initSmoke(canvas);
		void smoke.ready.then(onReady);

		return smoke.cleanup;
	});
</script>

<canvas bind:this={canvas} class="smoke-canvas"></canvas>
