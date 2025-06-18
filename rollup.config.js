import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/index.ts',
    output: [
        { format: 'cjs', file: 'dist/index.js' },
        { format: 'es', file: 'dist/index.esm.js' }
    ],
    plugins: [typescript({ tsconfig: "./tsconfig.json" })],
    external: ['vue', 'spark-md5'],
};