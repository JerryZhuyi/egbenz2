// src/MyComponent.ts
import { h, defineComponent } from 'vue'

export default defineComponent({
  name: 'aditorText',
  setup() {
    return () => h('span', 'Hello, world!')
  }
})