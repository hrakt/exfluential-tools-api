<script setup lang="ts">
import { ref } from 'vue';

interface ToolForm {
  name: string;
  type: string;
}

const form = ref<ToolForm>({
  name: '',
  type: 'calculator',
});

const isSubmitting = ref(false);
const message = ref<string | null>(null);
const error = ref<string | null>(null);

const API_BASE = 'http://localhost:3000'; // backend

async function createTool() {
  isSubmitting.value = true;
  message.value = null;
  error.value = null;

  try {
    const res = await fetch(`${API_BASE}/tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form.value),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || 'Failed to create tool');
    }

    message.value = `Created tool "${data.name}" (id: ${data.id}).`;

    // reset form
    form.value = {
      name: '',
      type: 'calculator',
    };
  } catch (err: any) {
    error.value = err.message ?? 'Something went wrong';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
    <div class="w-full max-w-md p-6 bg-slate-900/80 rounded-xl shadow-lg border border-slate-800">
      <h1 class="text-2xl font-semibold mb-1">Create Tool</h1>
      <p class="text-sm text-slate-300 mb-6">
        Fill out the form to create a new tool in the backend (Node + Postgres).
      </p>

      <form class="space-y-4" @submit.prevent="createTool">
        <div>
          <label class="block text-sm mb-1">Tool Name</label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="ROI Calculator"
            class="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label class="block text-sm mb-1">Tool Type</label>
          <select
            v-model="form.type"
            class="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="calculator">Calculator</option>
            <option value="guide">Guide</option>
            <option value="form">Form</option>
          </select>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full mt-2 inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {{ isSubmitting ? 'Creating…' : 'Create Tool' }}
        </button>
      </form>

      <p v-if="message" class="mt-4 text-sm text-emerald-400">
        {{ message }}
      </p>
      <p v-if="error" class="mt-4 text-sm text-red-400">
        {{ error }}
      </p>
    </div>
  </main>
</template>