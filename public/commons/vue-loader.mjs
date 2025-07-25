import * as Vue from 'vue'
import * as pinia from 'pinia'
import axios from 'axios'

import { loadModule } from 'vue3-sfc-loader';

console.log('Setting up vue loader...')

// vue3-sfc-loader options
const options = {
    moduleCache: {
      vue: Vue,
      pinia: pinia,
      axios: axios
    },
    getFile(url) {
      return fetch(url, {cache: 'no-cache'}).then(response => response.ok ? response.text() : Promise.reject(response));
    },
    addStyle(styleStr) {
      const style = document.createElement('style');
      style.textContent = styleStr;
      const ref = document.head.getElementsByTagName('style')[0] || null;
      document.head.insertBefore(style, ref);
    },
    log(type, ...args) {
      console.log(type, ...args);
    }
}

function load(vueFile) {
  console.log(`[vue-loader > load] ${vueFile}`)
  return Vue.defineAsyncComponent(() => loadModule(vueFile, options))
}

function ref(vueFile) {
    console.log(`[vue-loader > ref] ${vueFile}`)
    return () => loadModule(vueFile, options)
}

export {
    load, ref
}