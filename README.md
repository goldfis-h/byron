# byron-vue-upload-file

<div align="center">
  <div style="display: flex; gap: 8px; justify-content: center; margin-bottom: 16px;">
    <img src="https://img.shields.io/badge/Vue3-4FC08D?style=flat&logo=vue.js&logoColor=white" alt="Vue3"/>
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/License-MIT-green?style=flat" alt="MIT License"/>
  </div>
  <h3>基于 Vue3 的现代化文件上传插件</h3>
  <p>支持分片上传、断点续传和并发控制，提供灵活的 API 和完整的类型支持</p>
  <br/>
  <a href="#特性"><b>特性</b></a> •
  <a href="#安装"><b>安装</b></a> •
  <a href="#使用方式"><b>使用方式</b></a> •
  <a href="#配置选项"><b>配置选项</b></a> •
  <a href="#实例方法"><b>实例方法</b></a> •
  <a href="#后端接口要求"><b>后端接口</b></a> •
  <a href="#示例组件"><b>示例组件</b></a>
  <br/><br/>
</div>

## 📋 目录

- [特性](#特性)
- [安装](#安装)
- [使用方式](#使用方式)
- [配置选项](#配置选项)
- [实例方法](#实例方法)
- [上传状态](#上传状态)
- [后端接口要求](#后端接口要求)
- [示例组件](#示例组件)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## ✨ 核心特性

- 🚀 **灵活上传模式** - 支持分片上传与整体上传两种模式，可通过配置自由切换
- 🔄 **断点续传** - 网络中断或暂停后可恢复上传进度，无需重新开始
- 🧠 **智能分片** - 根据文件大小和配置自动分片，提升大文件上传成功率
- ⚡ **并发控制** - 可配置同时上传的分片数量，优化带宽利用
- 📊 **完整回调** - 上传进度、完成、失败等状态变更实时反馈
- 🔒 **类型安全** - 使用 TypeScript 开发，提供完整的类型定义
- 🛠️ **双 API 支持** - 同时支持 Options API 和 Composition API
- 🧩 **可扩展性** - 支持自定义分片检查、上传和合并逻辑
- ⚠️ **错误处理** - 完善的错误处理机制，包括超时、网络错误等
- 🔧 **自定义请求头** - 可配置上传请求头，满足个性化需求
- 📈 **上传进度可视化** - 提供上传进度条，方便用户监控上传状态

## 🚀 快速开始

只需几步即可快速集成到您的项目中：

```vue
<template>
  <input type="file" @change="handleFileChange" />
</template>

<script setup>
import { useUploader } from 'byron-vue-upload-file';

const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (file) {
    const uploader = useUploader({ uploadUrl: '/api/upload' });
    if (uploader.setFile(file)) await uploader.start();
  }
};
</script>
```

## 📦 安装

使用 npm 或 yarn 安装：

```bash
# npm
npm install byron-vue-upload-file --save

# yarn
yarn add byron-vue-upload-file
```

## 🔨 使用方式

### 1. 全局安装插件

在 main.js 中安装插件：

```javascript
import { createApp } from 'vue';
import App from './App.vue';
import UploaderPlugin from 'byron-vue-upload-file';

const app = createApp(App);

// 安装上传插件
app.use(UploaderPlugin, {
  // 可选的全局配置
  globalMethodName: '$uploader', // 全局方法名称
  defaultUploadOptions: {
    chunkSize: 2, // 默认分片大小(MB)
    uploadUrl: '/api/upload', // 默认上传接口URL
    concurrency: 3, // 默认并发数
  },
});

app.mount('#app');
```

### 2. 在组件中使用

#### 2.1 Options API

```vue
<template>
  <input type="file" @change="handleFileChange" />
</template>

<script>
export default {
  methods: {
    async handleFileChange(e) {
      const file = e.target.files[0];
      if (file) {
        // 创建上传实例
        const uploader = this.$uploader({
          uploadUrl: '/api/upload',
          chunkSize: 2,
          onProgress: (progress) => console.log('进度:', progress),
          onComplete: (result) => console.log('完成:', result),
          onError: (error) => console.error('错误:', error),
        });

        // 设置文件并开始上传
        if (uploader.setFile(file)) {
          await uploader.start();
        }
      }
    },
  },
};
</script>
```

#### 2.2 Composition API

```vue
<template>
  <input type="file" @change="handleFileChange" />
</template>

<script setup>
import { useUploader } from 'byron-vue-upload-file';

const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (file) {
    // 创建上传实例
    const uploader = useUploader({
      uploadUrl: '/api/upload',
      useChunkedUpload: true, // 启用分片上传
      chunkSize: 2,
      concurrency: 3,
    });

    // 设置上传回调
    uploader.onProgress = (progress) => {
      console.log('上传进度:', progress);
    };

    uploader.onComplete = (result) => {
      console.log('上传完成:', result);
    };

    // 设置文件并开始上传
    if (uploader.setFile(file)) {
      await uploader.start();
    }
  }
};
</script>
```

### 3. 直接创建实例

独立使用 Uploader 类：

```javascript
import { Uploader } from 'byron-vue-upload-file';

// 创建上传实例
const uploader = new Uploader({
  uploadUrl: '/api/upload',
  useChunkedUpload: false, // 禁用分片上传，直接上传整个文件
  maxSize: 100, // 最大文件大小(MB)
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
});

// 设置文件
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && uploader.setFile(file)) {
    // 开始上传
    uploader
      .start()
      .then((result) => console.log('上传成功:', result))
      .catch((error) => console.error('上传失败:', error));
  }
});
```

## ⚙️ 配置选项 (UploadOptions)

### 配置选项详情

#### 基础配置

- **uploadUrl** (string): **必填**，上传接口基础 URL
- **useChunkedUpload** (boolean): 是否启用分片上传，默认 `true`
- **chunkSize** (number): 分片大小 (MB)，仅在分片上传时有效，默认 `2`
- **maxSize** (number): 最大文件大小 (MB)，默认 `50`
- **allowedTypes** (string[]): 允许的文件 MIME 类型数组，默认 `[]`
- **concurrency** (number): 并发上传数量，仅在分片上传时有效，默认 `3`

#### 高级配置

- **fileIdFieldName** (string): 文件 ID 参数名，用于接口通信，默认 `'fileId'`
- **checkTimeout** (number): 分片检查超时时间 (ms)，默认 `5000`

#### 回调函数

- **onProgress** ((progress: number) => void): 上传进度回调 (0-100)
- **onHashProgress** ((progress: number) => void): 哈希计算进度回调 (0-100)
- **onComplete** ((result: any) => void): 上传完成回调
- **onError** ((error: Error) => void): 错误回调，接收 Error 对象

**哈希计算进度回调示例**:

```javascript
const uploader = new Uploader({
  // ...其他配置
  onHashProgress: (progress) => {
    console.log(`哈希计算进度: ${progress}%`);
  },
});
```

### 🌐 浏览器兼容性

✅ **支持**: Web Worker (IE 10+), FileReader API (IE 10+), FormData (IE 10+), AbortController (Chrome 66+)

> ⚠️ 不支持Web Worker的环境将自动降级为同步计算（可能阻塞UI线程）

## 📚 Uploader 实例方法

- **setFile(file: File)**: boolean - 设置要上传的文件，验证通过返回 true
- **start()**: Promise<void> - 开始上传
- **pause()**: void - 暂停上传
- **resume()**: void - 继续上传
- **cancel()**: void - 取消上传
- **getStatus()**: UploadStatus - 获取当前上传状态
- **getProgress()**: number - 获取当前上传进度 (0-100)

## 📊 上传状态 (UploadStatus)

上传状态类型: `'idle'` (空闲) | `'ready'` (就绪) | `'uploading'` (上传中) | `'paused'` (暂停) | `'complete'` (完成) | `'error'` (错误)

### 状态流转说明

- 初始状态为 `idle`（空闲）
- 调用 `setFile()` 方法后进入 `ready`（就绪）状态
- 调用 `start()` 方法后进入 `uploading`（上传中）状态
- 上传中可调用 `pause()` 进入 `paused`（暂停）状态
- 暂停状态可调用 `resume()` 返回 `uploading`（上传中）状态
- 上传成功完成进入 `complete`（完成）状态
- 上传失败或调用 `cancel()` 进入 `error`（错误）状态
- 错误状态可调用 `reset()` 返回 `ready`（就绪）状态
- 完成状态可调用 `reset()` 返回 `idle`（空闲）状态

## 🔄 后端接口要求

为支持完整的上传功能，后端需要实现以下三个接口：

### 1. 分片检查接口

- **URL**: `${uploadUrl}/check?${fileIdFieldName}=${fileId}`
- **方法**: GET
- **返回**: `{ uploadedIndexes: number[] }`
- **功能**：检查哪些分片已上传，返回已上传分片索引数组

### 2. 分片上传接口

- **URL**: `${uploadUrl}`
- **方法**: POST
- **Content-Type**: multipart/form-data
- **FormData 字段**:
  - `${fileIdFieldName}`: 文件唯一标识
  - chunkIndex: 分片索引
  - chunk: 分片文件
  - totalChunks: 总分片数
- **功能**：上传单个分片数据

### 3. 分片合并接口

- **URL**: `${uploadUrl}/merge`
- **方法**: POST
- **Content-Type**: application/json
- **Body**:
  ```json
  {
    "${fileIdFieldName}": "文件唯一标识",
    "totalChunks": "总分片数",
    "fileName": "原始文件名"
  }
  ```
- **功能**：通知后端所有分片已上传，请求合并文件

## 📝 示例组件

### 📸 带进度显示的完整上传组件

以下是一个功能齐全的上传组件示例，包含文件选择、进度显示和上传控制：

```vue
<template>
  <div class="upload-container">
    <input type="file" @change="handleFileChange" />
    <div v-if="progress > 0 || status === 'complete'" class="progress-bar">
      <div :style="{ width: `${progress}%` }" class="progress"></div>
      <span class="progress-text">{{ progress }}%</span>
    </div>
    <div class="controls">
      <button @click="startUpload" :disabled="!canStart">开始</button>
      <button @click="pauseUpload" :disabled="!canPause">暂停</button>
      <button @click="resumeUpload" :disabled="!canResume">继续</button>
      <button @click="cancelUpload" :disabled="!canCancel">取消</button>
    </div>
    <div class="status">{{ statusText }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useUploader } from 'byron-vue-upload-file';

const uploader = useUploader({
  uploadUrl: '/api/upload',
  chunkSize: 2,
  concurrency: 3,
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  maxSize: 50,
});

const progress = ref(0);
const file = ref(null);

uploader.onProgress = (p) => (progress.value = p);
uploader.onComplete = () => alert('文件上传成功!');
uploader.onError = (error) => alert(`上传失败: ${error}`);

const status = computed(() => uploader.getStatus());
const statusText = computed(
  () =>
    ({
      idle: '未选择文件',
      ready: '就绪',
      uploading: '上传中',
      paused: '已暂停',
      complete: '上传完成',
      error: '上传错误',
    })[status.value]
);

const canStart = computed(() => status.value === 'ready' || status.value === 'paused');
const canPause = computed(() => status.value === 'uploading');
const canResume = computed(() => status.value === 'paused');
const canCancel = computed(() => status.value !== 'idle' && status.value !== 'complete');

const handleFileChange = (e) => {
  const selectedFile = e.target.files[0];
  if (selectedFile) {
    file.value = selectedFile;
    progress.value = 0;
    uploader.setFile(selectedFile);
  }
};

const startUpload = async () => file.value && (await uploader.start());
const pauseUpload = () => uploader.pause();
const resumeUpload = () => uploader.resume();
const cancelUpload = () => {
  uploader.cancel();
  progress.value = 0;
};

onUnmounted(() => uploader.cancel());
</script>

<style scoped>
.upload-container {
  max-width: 500px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.progress-bar {
  height: 10px;
  background: #f3f4f6;
  border-radius: 5px;
  margin: 15px 0;
  overflow: hidden;
  position: relative;
}
.progress {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}
.progress-text {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #6b7280;
}
.controls {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}
button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
button:enabled {
  background: #3b82f6;
  color: white;
}
button:disabled {
  background: #9ca3af;
  color: #ffffff;
  cursor: not-allowed;
}
.status {
  color: #4b5563;
  font-size: 14px;
  padding: 8px;
  border-radius: 4px;
  background: #f9fafb;
}
</style>
```

## 🤝 贡献指南

非常欢迎贡献代码！请按照以下步骤操作：

### 详细步骤

1. 🍴 Fork 本仓库
2. 🌿 创建特性分支: `git checkout -b feature/amazing-feature`
3. ✨ 提交更改: `git commit -m 'Add some amazing feature'`
4. 🚀 推送到分支: `git push origin feature/amazing-feature`
5. 📝 打开 Pull Request

## 📄 许可证

<div align="center">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License"/>
</div>

本项目采用 [MIT 许可证](LICENSE)，您可以自由使用、复制、修改、合并、发布、分发、再许可和销售本软件的副本，前提是保留原始版权和许可声明。

## 📞 联系我们

<div style="display: flex; gap: 16px; justify-content: center; margin: 20px 0;">
  <a href="https://github.com/goldfis-h/byron/issues" style="display: flex; align-items: center; gap: 8px;">
    <img src="https://img.shields.io/badge/GitHub-Issues-blue?style=flat&logo=github" alt="GitHub Issues"/>
  </a>
  <a href="mailto:130109514@qq.com" style="display: flex; align-items: center; gap: 8px;">
    <img src="https://img.shields.io/badge/Email-Contact%20Us-green?style=flat&logo=gmail" alt="Email"/>
  </a>
</div>

如有任何问题或建议，请通过以上方式联系我们，我们将尽快回复您。
