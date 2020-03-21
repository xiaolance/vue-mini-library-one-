class Compiler {
    constructor(vm) {
        // console.log(el)
        this.vm = vm
        this.fragment = this.node2Fragment(vm.$el)

        //编译文档碎片中的所有节点
        this.compile(this.fragment)

        //把编译好的文档碎片添加到dom树中
        this.vm.$el.appendChild(this.fragment)

    }
    //把挂载点的dom移到文档碎片中
    node2Fragment(el) {
        let fragment = document.createDocumentFragment()
        let child = null
        while (child = el.firstChild) {
            fragment.appendChild(child)
        }
        return fragment
    }
    compile(node) {
        //获取所有的节点
        let childs = node.childNodes

        // console.log(childs)
        childs.forEach(child => {
            let reg = /\{\{(.+?)\}\}/g  //该正则配置插值符号
            if (this.isTextNode(child) && reg.test(child.nodeValue)) {   //如果是文本节点并且有插值符号  那就编译文本节点
                // console.log(child.nodeValue)
                this.compileText(child)
            } else if (this.isElementNode(child)) {  //如果是元素节点 那就编译元素节点
                this.compileElement(child)
            }
            //再次编译child 
            this.compile(child)
        })
    }

    //处理指令
    compileElement(node) {
        let attrs = node.attributes
        //获取元素节点的属性节点
        Array.from(attrs).forEach(attr => {
            //获取属性节点的 名字和值
            let { nodeName, nodeValue } = attr  //v-html v-text

            if (this.isDirective(nodeName)) { //如果是vue指令
                let [, dir] = nodeName.split('-')    //获取指令名  text html   
                if (this.isEventDirective(dir)) {   //如果是事件指令 
                    console.log('事件指令', dir, nodeName)
                } else {//如果不是事件指令 
                    // console.log( '非事件指令',dir,nodeName)
                    CompileUtil[dir](node, nodeValue, this.vm.$data)
                }
                //删除指令
                node.removeAttribute(nodeName)

            }
        })
    }

    //判断是不是vue指令
    isDirective(nodeName) {
        return nodeName.startsWith('v-')
    }

    //判断是不是vue的事件指令
    isEventDirective(dir) {
        return dir.includes(':')
    }

    //处理插值符号 {{}}
    compileText(node) {
        // console.log('文本节点',node)
        let reg = /\{\{(.+?)\}\}/g
        ///我是---{{person.name}}
        node.nodeValue = node.nodeValue.replace(reg, ($, exp) => {
            //exp --> person.name   根据该字符串获取data中的person.name
            // console.log($,exp,this.vm.$data)
            // return this.getValue(exp)
            return CompileUtil.getValue(exp, this.vm.$data)
        })
        // console.log(node.nodeValue)
    }


    //判断是不是文本节点
    isTextNode(node) {
        return node.nodeType === 3
    }
    //判断是不是元素节点
    isElementNode(node) {
        return node.nodeType === 1
    }
}

//该对象管理所有的指令的原生dom操作
CompileUtil = {
    html(node, exp, data) {
        // console.log('html', node, exp)
        node.innerHTML = this.getValue(exp, data)
    },
    text(node, exp, data) {
        // console.log('text')
        node.innerText = this.getValue(exp, data)
    },
    model(node, exp, data) {
        // console.log('model')
        node.value = this.getValue(exp, data)
    },
    class(node, exp, data) {
        // console.log('class')
        let className = this.getValue(exp, data)
        // console.log(className)
        if(!node.classList.contains(className)){   //判断类名存不存在  如果不存在 就添加该类名
            node.classList.add(className)   
        }
    },
    //基于字符串获取data中的数据
    getValue(exp, data) {
        // console.log(exp,exp.split('.')) //["person", "name"]
        return exp.split('.').reduce((data, next) => data[next], data)
    }
}