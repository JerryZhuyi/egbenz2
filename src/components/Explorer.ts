// FileSystem
import { reactive, readonly } from 'vue';
import { request } from '../api/index.ts';
import type Node from 'element-plus/es/components/tree/src/model/node'

const FIXED_ROOT = '所有笔记';

export interface FilesTreeNode {
    label: string;
    path: string;
    isLeaf: boolean;
    children?: FilesTreeNode[];
}

const state = reactive({
    root: {} as Node,
    openedDocs: [] as FilesTreeNode[],
    openedDoc: {path:""} as FilesTreeNode | undefined | null
});

async function loadNode(node: Node, resolve: (data: FilesTreeNode[]) => void){
    if(node.level==0){
        state.root = node
        resolve([{label:FIXED_ROOT, path:FIXED_ROOT, isLeaf:false}])
    }else if(!node.isLeaf){
        let childNodes:FilesTreeNode[] = []
        request.getFiles({ path:node.data.path }).then((res) => {
            res.data.data.files.forEach((file:{name:string, type:string, children?:[]}) => {
                if(file.type == 'folder'){
                    childNodes.push({
                        label: file.name,
                        path: node.data.path+'/'+file.name,
                        children: [],
                        isLeaf: false
                    });
                }else{
                    childNodes.push({
                        label: file.name,
                        path: node.data.path+'/'+file.name,
                        isLeaf: true
                    });
                }
            })
            resolve(childNodes)
        }).catch((res) => {
            resolve([])
        })
    }
}

function nodeClickHandler(data:FilesTreeNode, node:Node, tree:Node, e){
    if(node.isLeaf){
        // 如果没有相同的path，加入到已打开的文档列表
        if(!state.openedDocs.some((doc) => doc.path == data.path)){
            state.openedDocs.push(data)
        }
        // 如果已经打开了文档，就切换到该文档
        state.openedDoc = state.openedDocs.find((doc) => doc.path == data.path)
    }
}

// 导出状态和函数
export default {
  state: readonly(state), // 使用 readonly 来防止直接修改状态
  loadNode,
  nodeClickHandler
};
