// FileSystem
import { reactive, readonly, computed } from 'vue';
import { request } from '../api/index.ts';
import type Node from 'element-plus/es/components/tree/src/model/node'
import { ElTree } from 'element-plus'

const FIXED_ROOT = '所有笔记';

export interface FilesTreeNode {
    label: string;
    path: string;
    isLeaf: boolean;
    children?: FilesTreeNode[];
}

const state = reactive({
    root: {} as Node,
    openedNodes: [] as Node[],
    openedNode: {} as Node,
});

async function loadNode(node: Node, resolve: (data: FilesTreeNode[]) => void) {
    if (node.level == 0) {
        state.root = node
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
            resolve([])
        })
    }
}

function nodeClickHandler(data: FilesTreeNode, node: Node, tree: Node, e) {
    console.log(tree)
    if (node.isLeaf) {
        if (!state.openedNodes.some((node) => node.data.path == data.path)) {
            state.openedNodes.push(node)
        }
        // 如果已经打开了文档，就切换到该文档
        setOpenedDoc(data.path)
    }
}

function setOpenedDoc(path: string) {
    // 遍历node树，根据path找到对应node的id 
    state.openedNode = state.openedNodes.find((node) => node.data.path == path) || state.root;
    // 把其他打开的设置为非当前
    state.openedNodes.forEach((node) => {
        node.isCurrent = false
    })
    state.openedNode.isCurrent = true
}


const openedNodePath = computed({
    get() {
        return state.openedNode?.data ? state.openedNode.data.path : ''
    },
    set(newValue: string) {
        setOpenedDoc(newValue)
    }
})


export default {
    state: readonly(state), // 使用 readonly 来防止直接修改状态
    loadNode,
    nodeClickHandler,
    setOpenedDoc,
    openedNodePath,
};
