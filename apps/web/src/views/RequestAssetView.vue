<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { RouterLink } from 'vue-router';

interface RequestForm {
  doctorName: string;
  practiceName: string;
  practiceType: string;
  channel: string;
  primaryMessage: string;
}

const form = ref<RequestForm>({
  doctorName: '',
  practiceName: '',
  practiceType: 'Dental',
  channel: 'social',
  primaryMessage: '',
});

const status = ref<'idle' | 'submitting' | 'pending' | 'processing' | 'ready' | 'failed'>('idle');
const requestId = ref<number | null>(null);
const assetUrl = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

let pollInterval: number | null = null;
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function submitRequest() {
  status.value = 'submitting';
  errorMessage.value = null;
  assetUrl.value = null;

  try {
    const res = await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to submit request');
    }

    const data = await res.json();
    requestId.value = data.id;
    status.value = 'pending';
    
    // Start polling
    startPolling(data.id);

  } catch (err: any) {
    status.value = 'failed';
    errorMessage.value = err.message;
  }
}

function startPolling(id: number) {
  if (pollInterval) clearInterval(pollInterval);
  
  pollInterval = window.setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE}/requests/${id}`);
      if (!res.ok) return;

      const data = await res.json();
      
      if (data.status === 'ready') {
        status.value = 'ready';
        assetUrl.value = data.assetUrl;
        stopPolling();
      } else if (data.status === 'failed') {
        status.value = 'failed';
        errorMessage.value = data.errorMessage;
        stopPolling();
      } else {
        status.value = data.status;
      }
    } catch (e) {
      console.error('Polling error', e);
    }
  }, 2000);
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

onUnmounted(() => {
  stopPolling();
});
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
    <div class="w-full max-w-lg p-6 bg-slate-900/80 rounded-xl shadow-lg border border-slate-800">
      
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-semibold">Request Marketing Asset</h1>
        <RouterLink to="/" class="text-sm text-emerald-500 hover:text-emerald-400">Back to Home</RouterLink>
      </div>

      <form v-if="status === 'idle' || status === 'submitting' || status === 'failed'" @submit.prevent="submitRequest" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
            <div>
            <label class="block text-sm mb-1 text-slate-400">Doctor Name</label>
            <input v-model="form.doctorName" type="text" required placeholder="Dr. Smith" class="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
            <label class="block text-sm mb-1 text-slate-400">Practice Type</label>
            <input v-model="form.practiceType" type="text" required placeholder="Dental" class="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
        </div>

        <div>
          <label class="block text-sm mb-1 text-slate-400">Practice Name</label>
          <input v-model="form.practiceName" type="text" required placeholder="Bright Smiles" class="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
        </div>

        <div>
          <label class="block text-sm mb-1 text-slate-400">Channel</label>
          <select v-model="form.channel" class="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
            <option value="social">Social Media Post</option>
            <option value="email">Email Campaign</option>
            <option value="poster">Poster</option>
          </select>
        </div>

        <div>
          <label class="block text-sm mb-1 text-slate-400">Primary Message</label>
          <textarea v-model="form.primaryMessage" required rows="3" placeholder="e.g. 50% off teeth whitening this summer..." class="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"></textarea>
        </div>

        <button type="submit" :disabled="status === 'submitting'" class="w-full mt-4 rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
          {{ status === 'submitting' ? 'Submitting...' : 'Generate Asset' }}
        </button>
        
        <p v-if="status === 'failed'" class="text-red-400 text-sm mt-2">Error: {{ errorMessage }}</p>
      </form>

      <div v-else-if="status === 'pending' || status === 'processing'" class="text-center py-10">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
        <h2 class="text-xl font-medium mb-2">Generating Asset...</h2>
        <p class="text-slate-400 text-sm">Status: {{ status }}</p>
      </div>

      <div v-else-if="status === 'ready'" class="space-y-4">
        <div class="bg-emerald-900/30 border border-emerald-500/30 p-4 rounded text-center">
          <h2 class="text-lg font-semibold text-emerald-400 mb-2">Asset Ready!</h2>
          
          <div v-if="assetUrl && assetUrl.startsWith('http')" class="mt-4">
            <img :src="assetUrl" alt="Generated Asset" class="max-w-full rounded shadow-lg mx-auto" />
          </div>
          <div v-else class="mt-4 p-4 bg-slate-800 rounded text-left font-mono text-sm whitespace-pre-wrap">
            {{ assetUrl }}
          </div>
        </div>
        
        <button @click="status = 'idle'" class="w-full rounded border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
          Create Another
        </button>
      </div>

    </div>
  </main>
</template>