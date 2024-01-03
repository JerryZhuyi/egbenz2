<template>
  <div :selstart="selStart" :seloffsetcor="selOffsetCor"><slot></slot><br :selstart="selStart" v-if="aNode.children.length == 1 && aNode.children[0].length() == 0" /></div>
</template>
  
<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { AditorChildNode, ANode } from '@lib/aditor/nodes';
import { AditorDocView, NodeSelectionType } from '@lib/aditor/index'

class AditorParagraphNode extends AditorChildNode {
  constructor(name: string, style:{}, data:{}) {
    super(name, style, data)
  }
  /** 
   * @description merge text node
   * @param _start 
   * @param _end 
   */
  selfMerge(_start: number, _end: number, vsel: NodeSelectionType[]){
    if(_start > this.end || _end < this.start){
      return
    }
    const defaultStyleKey = ['font-size', 'font-family', 'font-weight', 'font-style', 'text-decoration', 'color', 'background-color']
    const nvl = (value: string | null | undefined)=>{
      if(value == undefined || value == null){
        return 'default'
      }else{
        return value
      }
    }
    const shouldMerge = (_node_1: ANode, _node_2: ANode)=>{
      if(_node_1.name === 'aditorText' && _node_2.name === 'aditorText'){
        // foreach dafaultStyleKey
        for(let i = 0; i < defaultStyleKey.length; i++){
          const key = defaultStyleKey[i]
          // if _node_1.style[key] != _node_2.style[key]
          if(nvl(_node_1.style[key]) != nvl(_node_2.style[key])){
            return false
          }
        }
        return true
      }else{
        return false
      }
    }
    let i = 0
    while(i < this.children.length-1){
      const mergeNode = this.children[i]
      const mergedNode = this.children[i+1]
      if (shouldMerge(mergeNode, mergedNode)) {
        for(let sel of vsel){
          if(sel.startNode && sel.startNode.start == mergedNode.start){
            sel.startNode = mergeNode
            sel.startOffset += mergeNode.length()
          }
          if(sel.endNode && sel.endNode.start == mergedNode.start){
            sel.endNode = mergeNode
            sel.endOffset += mergeNode.length()
          }
        }
        this.children[i].data.text += this.children[i + 1].data.text
        this.children.splice(i + 1, 1)
      } else {
        i++;
      }
    }
  }
}

export default defineComponent({
  name: 'aditorParagraph',
  props: {
    aNode: {
      type: Object as PropType<AditorChildNode>,
      required: true,
    },
    docView: {
      type: Object as PropType<AditorDocView>,
      required: true,
    }
  },
  setup(props) {
    const selStart = computed(() => {
      if(props.aNode.children.length > 0){
        if(props.aNode.children[0].length() == 0){
          return props.aNode.children[0].start
        }
      }
      return props.aNode.start
    })

    const selOffsetCor = computed(()=>{
      if(props.aNode.children.length > 0){
        if(props.aNode.children[0].length() == 0){
          return 3
        }
      }
      return 0
    })

    return {
      selStart,
      selOffsetCor
    }
  },

  aditorConfig: {
    class: AditorParagraphNode
  }
})
</script>

<style scoped></style>