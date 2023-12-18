// FileSystem
import { reactive, readonly, computed } from 'vue';
import { request } from '../api/index.ts';
import type Node from 'element-plus/es/components/tree/src/model/node'
import { ElTree } from 'element-plus'
import { docStruct } from '@lib/aditor'

export type CustomNode = Node & { data: FilesTreeNode };

const FIXED_ROOT = '所有笔记';

export interface FilesTreeNode {
    label: string;
    path: string;
    isLeaf: boolean;
    children?: FilesTreeNode[];
    docJson?: docStruct;
}
export const defaultProps = {
    children: 'children',
    label: 'label',
    path: 'path',
    isLeaf: 'isLeaf',
}

const state = reactive({
    elTreeRef: {} as InstanceType<typeof ElTree>,
    root: {} as CustomNode,
    openedNodes: [] as CustomNode[],
    openedNode: {} as CustomNode,
});

async function loadNode(node: Node|CustomNode, resolve: (data: FilesTreeNode[]) => void) {
    if (node.level == 0) {
        state.root = node as CustomNode
        resolve([{ label: FIXED_ROOT, path: FIXED_ROOT, isLeaf: false }])
    } else if (!node.isLeaf) {
        let childNodes: FilesTreeNode[] = []
        request.getFiles({ path: node.data.path }).then((res) => {
            res.data.data.files.forEach((file: { name: string, type: string, children?: [] }) => {
                if (file.type == 'folder') {
                    childNodes.push({
                        label: file.name,
                        path: node.data.path + '/' + file.name,
                        children: [],
                        isLeaf: false
                    });
                } else {
                    childNodes.push({
                        label: file.name,
                        path: node.data.path + '/' + file.name,
                        isLeaf: true
                    });
                }
            })
            resolve(childNodes)
        }).catch((res) => {
            console.warn(res)
            resolve([])
        })
    }
}

function nodeClickHandler(data: FilesTreeNode, node: CustomNode, tree: InstanceType<typeof ElTree>, e: MouseEvent) {
    if (node.isLeaf) {
        setOpenedDoc(data.path)
    }
}

function setOpenedDoc(path: string) {
    if (!state.openedNodes.some((node) => node.data.path == path)) {
        const openedNode = state.elTreeRef.getNode(path) as CustomNode
        state.openedNodes.push(openedNode)
        // 获取文件内容
        request.getAditorFiles({ path }).then((res) => {
            if(res.data.status == 200){
                openedNode.data.docJson = res.data.data.doc
            }
        }).catch((res)=>{
            console.warn(res)
        })
    }

    state.openedNode = state.openedNodes.find((node) => node.data.path == path) || {} as CustomNode;

    state.elTreeRef.setCurrentKey(path)
}


const openedNodePath = computed({
    get() {
        return state.openedNode?.data ? state.openedNode.data.path : ''
    },
    set(newValue: string) {
        setOpenedDoc(newValue)
    }
})

function mountElTreeRef(tree: InstanceType<typeof ElTree>) {
    state.elTreeRef = tree
}

function closeOpenedDoc(path: string) {
    if(state.openedNode.data.path == path){
        state.openedNodes.forEach((node, index)=>{
            if(node.data.path === path){
                state.openedNode = state.openedNodes[index+1] || state.openedNodes[index-1] || {} as CustomNode
                if(state.openedNode?.data?.path){
                    setOpenedDoc(state.openedNode.data.path)
                }
            }
        })
    }

    state.openedNodes = state.openedNodes.filter((node) => node.data.path != path)
}

export default {
    state, // 使用 readonly 来防止直接修改状态
    loadNode,
    nodeClickHandler,
    setOpenedDoc,
    openedNodePath,
    mountElTreeRef,
    closeOpenedDoc
};
