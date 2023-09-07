<script setup lang="ts">
import { $createParagraphNode, $createTextNode, $getRoot } from '@meogic/lexical'
import {
  LexicalAutoFocusPlugin,
  LexicalComposer,
  LexicalContentEditable,
  LexicalHashtagPlugin,
  LexicalHistoryPlugin,
  LexicalLinkPlugin,
  LexicalListPlugin,
  LexicalRichTextPlugin,
} from '@meogic/lexical-vue'
import { $createHeadingNode, $createQuoteNode, HeadingNode, QuoteNode } from '@meogic/lexical-rich-text'
import { TableCellNode, TableNode, TableRowNode } from '@meogic/lexical-table'
import { $createListItemNode, $createListNode, ListItemNode, ListNode } from '@meogic/lexical-list'
import { CodeHighlightNode, CodeNode } from '@meogic/lexical-code'
import { $createLinkNode, AutoLinkNode, LinkNode } from '@meogic/lexical-link'
import { HashtagNode } from '@meogic/lexical-hashtag'
import {$createImageNode, ImageNode} from "./image-node";
import LexicalOperateImagePlugin from "./lexical-operate-image-plugin.vue";

function prePopulatedRichText() {
  const root = $getRoot()
  if (root.getFirstChild() === null) {
    const heading = $createHeadingNode('h1')
    heading.append($createTextNode('Welcome to the playground'))
    root.append(heading)
    root.append(
        $createParagraphNode()
            .append($createTextNode('aaaa'))
    )
    // @ts-ignore
    const image = $createImageNode({
      src: "https://qiniu.keepwork.com/70-5fd74149-814e-472d-8bec-44b56ae92b56.jpg?e=4834193186&token=LYZsjH0681n9sWZqCM4E2KmU6DsJOE7CAM4O3eJq:t7PphTkSZPsZWZLDni7cJkrGvRo=",
    })
    root.append($createParagraphNode().append(image))
    root.append(
        $createParagraphNode()
            .append($createTextNode('bbbb'))
    )
  }
}

const config = {
  theme: {
    ltr: 'ltr',
    rtl: 'rtl',
    placeholder: 'editor-placeholder',
    paragraph: 'editor-paragraph',
    quote: 'editor-quote',
    heading: {
      h1: 'editor-heading-h1',
      h2: 'editor-heading-h2',
      h3: 'editor-heading-h3',
      h4: 'editor-heading-h4',
      h5: 'editor-heading-h5',
    },
    list: {
      nested: {
        listitem: 'editor-nested-listitem',
      },
      ol: 'editor-list-ol',
      ul: 'editor-list-ul',
      listitem: 'editor-listitem',
    },
    image: 'editor-image',
    link: 'editor-link',
    hashtag: 'editor-text-hashtag',
    text: {
      bold: 'editor-text-bold',
      italic: 'editor-text-italic',
      underline: 'editor-text-underline',
      strikethrough: 'editor-text-strikethrough',
      underlineStrikethrough: 'editor-text-underlineStrikethrough',
      code: 'editor-text-code',
    },
    code: 'editor-code',
    codeHighlight: {
      'atrule': 'editor-tokenAttr',
      'attr': 'editor-tokenAttr',
      'boolean': 'editor-tokenProperty',
      'builtin': 'editor-tokenSelector',
      'cdata': 'editor-tokenComment',
      'char': 'editor-tokenSelector',
      'class': 'editor-tokenFunction',
      'class-name': 'editor-tokenFunction',
      'comment': 'editor-tokenComment',
      'constant': 'editor-tokenProperty',
      'deleted': 'editor-tokenProperty',
      'doctype': 'editor-tokenComment',
      'entity': 'editor-tokenOperator',
      'function': 'editor-tokenFunction',
      'important': 'editor-tokenVariable',
      'inserted': 'editor-tokenSelector',
      'keyword': 'editor-tokenAttr',
      'namespace': 'editor-tokenVariable',
      'number': 'editor-tokenProperty',
      'operator': 'editor-tokenOperator',
      'prolog': 'editor-tokenComment',
      'property': 'editor-tokenProperty',
      'punctuation': 'editor-tokenPunctuation',
      'regex': 'editor-tokenVariable',
      'selector': 'editor-tokenSelector',
      'string': 'editor-tokenSelector',
      'symbol': 'editor-tokenProperty',
      'tag': 'editor-tokenProperty',
      'url': 'editor-tokenOperator',
      'variable': 'editor-tokenVariable',
    },
  },
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    AutoLinkNode,
    LinkNode,
    HashtagNode,
    ImageNode,
  ],
  editable: true,
  editorState: prePopulatedRichText,
}

function onError(error: Error) {
  throw error
}
</script>

<template>
  <LexicalComposer :initial-config="config" @error="onError">
    <div class="editor-container">
      <div class="editor-inner">
        <LexicalRichTextPlugin>
          <template #contentEditable>
            <LexicalContentEditable class="editor-input" />
          </template>
          <template #placeholder>
            <div class="editor-placeholder">
              Enter some text...
            </div>
          </template>
        </LexicalRichTextPlugin>
        <LexicalHistoryPlugin />
        <LexicalAutoFocusPlugin />
        <LexicalListPlugin />
        <LexicalLinkPlugin />
        <LexicalHashtagPlugin />
        <LexicalOperateImagePlugin />
      </div>
    </div>
  </LexicalComposer>
</template>