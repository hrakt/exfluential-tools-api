<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { RouterLink } from 'vue-router';

interface RequestItem {
  id: number;
  doctorName: string;
  practiceName: string;
  practiceType: string;
  channel: string;
  primaryMessage: string;
  status: 'idle' | 'submitting' | 'pending' | 'processing' | 'ready' | 'failed' | 'completed';
  assetUrl?: string | null;
  errorMessage?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const requests = ref<RequestItem[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const ws = ref<WebSocket | null>(null);
const notification = ref<{ requestId: number; assetUrl: string } | null>(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function fetchRequests() {
  isLoading.value = true;
  error.value = null;
  try {
    const res = await fetch(`${API_BASE}/requests/all`);
    if (!res.ok) throw new Error('Failed to fetch requests');
    const data = await res.json();
    requests.value = data.sort((a: RequestItem, b: RequestItem) => b.id - a.id); // Newest first
  } catch (err: any) {
    error.value = err.message || 'Error loading requests';
  } finally {
    isLoading.value = false;
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString();
}

let refreshInterval: number | null = null;

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

onMounted(() => {
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
  ws.value = new WebSocket(wsUrl);

  ws.value.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'job-completed') {
      notification.value = data;
      
      // Wait 500ms for database to update before refreshing
      setTimeout(() => {
        fetchRequests();
      }, 500);
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        notification.value = null;
      }, 5000);
    }
  };

  fetchRequests();
});

onUnmounted(() => {
  stopAutoRefresh();
  if (ws.value) ws.value.close();
});
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 p-8">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Request History</h1>
          <p class="text-slate-400 mt-1">View all marketing asset generation requests.</p>
        </div>
        <div class="flex gap-3">
            <button @click="fetchRequests" class="px-4 py-2 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 transition text-sm">
                Refresh
            </button>
            <RouterLink to="/" class="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 font-medium text-white transition text-sm flex items-center gap-2">
            <span>+ New Request</span>
            </RouterLink>
            <RouterLink to="/" class="px-4 py-2 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 transition text-sm">
            Home
            </RouterLink>
        </div>
      </div>

      <div v-if="isLoading" class="py-20 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
        <p class="text-slate-400">Loading requests...</p>
      </div>

      <div v-else-if="error" class="bg-red-500/10 border border-red-500/20 p-6 rounded-xl text-center">
        <p class="text-red-400 mb-4">{{ error }}</p>
        <button @click="fetchRequests" class="text-sm px-4 py-2 bg-slate-800 rounded hover:bg-slate-700">Try Again</button>
      </div>

      <div v-else class="space-y-4">
        <div v-if="requests.length === 0" class="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800">
          <p class="text-slate-400 mb-4">No requests found.</p>
          <RouterLink to="/requests" class="text-emerald-400 hover:underline">Create your first request</RouterLink>
        </div>

        <div v-for="req in requests" :key="req.id" class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-emerald-500/30 transition shadow-sm group">
          <div class="flex justify-between items-start mb-3">
            <div>
              <div class="flex items-center gap-3 mb-1">
                <span class="font-semibold text-lg">{{ req.practiceName }}</span>
                <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">{{ req.practiceType }}</span>
              </div>
              <p class="text-sm text-slate-400">Dr. {{ req.doctorName }} • {{ req.channel }}</p>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span 
                class="px-2.5 py-1 rounded-full text-xs font-medium border uppercase tracking-wider"
                :class="{
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': req.status === 'ready' || req.status === 'completed',
                  'bg-amber-500/10 text-amber-400 border-amber-500/20': req.status === 'pending' || req.status === 'processing',
                  'bg-red-500/10 text-red-400 border-red-500/20': req.status === 'failed',
                  'bg-slate-800 text-slate-400 border-slate-700': req.status === 'idle' || req.status === 'submitting'
                }"
              >
                {{ req.status }}
              </span>
              <span class="text-xs text-slate-500">{{ formatDate(req.createdAt) }}</span>
            </div>
          </div>

          <div class="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50 mb-3">
            <p class="text-sm text-slate-300 line-clamp-2 italic">"{{ req.primaryMessage }}"</p>
          </div>

          <div v-if="(req.status === 'completed' || req.status === 'ready') && req.assetUrl" class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span class="text-xs text-slate-500">Asset Ready</span>
             <a :href="req.assetUrl" target="_blank" class="text-sm text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1">
               View Asset 
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
             </a>
          </div>
           <div v-if="req.status === 'failed' && req.errorMessage" class="mt-4 pt-3 border-t border-slate-800">
            <p class="text-xs text-red-400">Error: {{ req.errorMessage }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast notification -->
    <div v-if="notification" class="fixed top-4 right-4 bg-emerald-500 text-white p-4 rounded-lg shadow-lg">
      ✓ Asset generated for request {{ notification.requestId }}
      <a :href="notification.assetUrl" target="_blank" class="underline ml-2">View</a>
    </div>
  </main>
</template>
