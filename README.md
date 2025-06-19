# byron-vue-upload-file

基于 Vue3 的现代化文件上传插件，支持分片上传、断点续传和并发控制，提供灵活的 API 和完整的类型支持。

## ✨ 核心特性

- **灵活上传模式**：支持分片上传与整体上传两种模式，可通过配置自由切换
- **断点续传**：网络中断或暂停后可恢复上传进度，无需重新开始
- **智能分片**：根据文件大小和配置自动分片，提升大文件上传成功率
- **并发控制**：可配置同时上传的分片数量，优化带宽利用
- **完整回调**：上传进度、完成、失败等状态变更实时反馈
- **类型安全**：使用 TypeScript 开发，提供完整的类型定义
- **双 API 支持**：同时支持 Options API 和 Composition API，适应不同开发风格
- **可扩展性**：支持自定义分片检查、上传和合并逻辑
- **错误处理**：完善的错误处理机制，包括超时、网络错误等
- **自定义请求头**：可配置上传请求头，满足个性化需求
- **上传进度可视化**：提供上传进度条，方便用户监控上传状态

## 📦 安装

```bash
# npm
npm install byron-vue-upload-file --save

# yarn
yarn add byron-vue-upload-file
```

## 🔨 使用方式

### 1. 全局安装插件

```javascript
// main.js
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

#### 哈希计算进度回调

通过 `onHashProgress` 回调获取文件哈希计算进度（0-100）：

```javascript
const uploader = new Uploader({
  // ...其他配置
  onHashProgress: (progress) => {
    console.log(`哈希计算进度: ${progress}%`);
  },
});
```

#### 浏览器兼容性

| 特性            | 支持情况 | 最低版本要求 |
| --------------- | -------- | ------------ |
| Web Worker      | ✅ 支持  | IE 10+       |
| FileReader API  | ✅ 支持  | IE 10+       |
| FormData        | ✅ 支持  | IE 10+       |
| AbortController | ✅ 支持  | Chrome 66+   |

不支持Web Worker的环境将自动降级为同步计算（可能阻塞UI线程）

| 参数名           | 类型                                                  | 默认值    | 描述                                         |
| ---------------- | ----------------------------------------------------- | --------- | -------------------------------------------- |
| uploadUrl        | string                                                | -         | **必填**，上传接口基础 URL                   |
| useChunkedUpload | boolean                                               | true      | 是否启用分片上传                             |
| chunkSize        | number                                                | 2         | 分片大小 (MB)，仅在分片上传时有效            |
| fileIdFieldName  | string                                                | 'fileId'  | 文件 ID 参数名，用于接口通信                 |
| allowedTypes     | string[]                                              | []        | 允许的文件 MIME 类型数组，如 ['image/jpeg']  |
| maxSize          | number                                                | 50        | 最大文件大小 (MB)                            |
| concurrency      | number                                                | 3         | 并发上传数量，仅在分片上传时有效             |
| checkTimeout     | number                                                | 5000      | 分片检查超时时间 (ms)                        |
| checkChunk       | (fileId: string) => Promise<number[]>                 | undefined | 自定义分片检查函数，返回已上传的分片索引数组 |
| uploadChunk      | (chunk: Chunk, fileId: string) => Promise<boolean>    | undefined | 自定义分片上传函数，返回是否上传成功         |
| mergeChunks      | (fileId: string, totalChunks: number) => Promise<any> | undefined | 自定义分片合并函数，返回合并结果             |
| onProgress       | (progress: number) => void                            | -         | 上传进度回调 (0-100)                         |
| onComplete       | (result: any) => void                                 | -         | 上传完成回调                                 |
| onError          | (error: string) => void                               | -         | 错误回调                                     |

## 📚 Uploader 实例方法

| 方法名      | 参数       | 返回值        | 描述                                |
| ----------- | ---------- | ------------- | ----------------------------------- |
| setFile     | file: File | boolean       | 设置要上传的文件，验证通过返回 true |
| start       | -          | Promise<void> | 开始上传                            |
| pause       | -          | void          | 暂停上传                            |
| resume      | -          | void          | 继续上传                            |
| cancel      | -          | void          | 取消上传                            |
| getStatus   | -          | UploadStatus  | 获取当前上传状态                    |
| getProgress | -          | number        | 获取当前上传进度 (0-100)            |

## 📊 上传状态 (UploadStatus)

```typescript
type UploadStatus = 'idle' | 'ready' | 'uploading' | 'paused' | 'complete' | 'error';
```

## 🔄 后端接口要求

### 1. 分片检查接口

- **URL**: `${uploadUrl}/check?${fileIdFieldName}=${fileId}`
- **方法**: GET
- **返回**: `{ uploadedIndexes: number[] }`

### 2. 分片上传接口

- **URL**: `${uploadUrl}`
- **方法**: POST
- **Content-Type**: multipart/form-data
- **FormData 字段**:
  - `${fileIdFieldName}`: 文件唯一标识
  - chunkIndex: 分片索引
  - chunk: 分片文件
  - totalChunks: 总分片数

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

## 📝 示例组件

### 带进度显示的完整上传组件

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

// 创建上传实例
const uploader = useUploader({
  uploadUrl: '/api/upload',
  chunkSize: 2,
  concurrency: 3,
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  maxSize: 50,
});

// 状态管理
const progress = ref(0);
const file = ref(null);

// 监听上传事件
uploader.onProgress = (p) => (progress.value = p);
uploader.onComplete = (result) => {
  console.log('上传完成:', result);
  alert('文件上传成功!');
};
uploader.onError = (error) => {
  console.error('上传错误:', error);
  alert(`上传失败: ${error}`);
};

// 计算属性
const status = computed(() => uploader.getStatus());
const statusText = computed(() => {
  const statusMap = {
    idle: '未选择文件',
    ready: '就绪',
    uploading: '上传中',
    paused: '已暂停',
    complete: '上传完成',
    error: '上传错误',
  };
  return statusMap[status.value];
});

// 按钮状态控制
const canStart = computed(() => status.value === 'ready' || status.value === 'paused');
const canPause = computed(() => status.value === 'uploading');
const canResume = computed(() => status.value === 'paused');
const canCancel = computed(() => status.value !== 'idle' && status.value !== 'complete');

// 事件处理
const handleFileChange = (e) => {
  const selectedFile = e.target.files[0];
  if (selectedFile) {
    file.value = selectedFile;
    progress.value = 0;
    uploader.setFile(selectedFile);
  }
};

const startUpload = async () => {
  if (file.value) {
    await uploader.start();
  }
};

const pauseUpload = () => uploader.pause();
const resumeUpload = () => uploader.resume();
const cancelUpload = () => {
  uploader.cancel();
  progress.value = 0;
};

// 组件卸载时取消上传
onUnmounted(() => {
  uploader.cancel();
});
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

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详情参见 [LICENSE](LICENSE) 文件

## 📞 联系我们

如有任何问题或建议，请提交 [issue](https://github.com/goldfis-h/byron/issues) 或发送邮件至 130109514@qq.com
