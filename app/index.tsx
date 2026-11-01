import { useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import EditorWebView from '../src/components/EditorWebView';
import { createWorkspaceFile, createWorkspaceFolder, listWorkspace, readWorkspaceFile, writeWorkspaceFile } from '../src/lib/workspace';
import type { OpenTab, WorkspaceFile } from '../src/types/editor';

const C = { bg:'#111318', panel:'#191c22', line:'#2a2e37', text:'#e7e9ee', muted:'#8c93a1', blue:'#4da3ff', green:'#8bd49c', yellow:'#e6c27a' };
const ext = (name:string) => name.split('.').pop()?.toLowerCase() || '';
const icon = (file:WorkspaceFile) => file.isDirectory ? 'folder' : (ext(file.name)==='py'?'logo-python':ext(file.name)==='html'?'logo-html5':ext(file.name)==='css'?'logo-css3':'code-slash');
const seedFiles = [
  { name:'index.html', content:'<!doctype html>\n<html>\n  <head><title>My app</title></head>\n  <body>\n    <h1>Hello from MH Code</h1>\n  </body>\n</html>\n' },
  { name:'styles.css', content:'body {\n  font-family: sans-serif;\n  background: #111318;\n  color: white;\n}\n' },
  { name:'app.js', content:'console.log("Hello from MH Code");\n' },
  { name:'main.py', content:'print("Hello from MH Code")\n' },
];

export default function EditorScreen() {
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [active, setActive] = useState('');
  const [explorer, setExplorer] = useState(true);
  const [terminal, setTerminal] = useState(false);
  const [logs, setLogs] = useState<string[]>(['MH Code workspace ready.']);
  const [dialog, setDialog] = useState<'file'|'folder'|null>(null);
  const [name, setName] = useState('');
  const activeTab = tabs.find(t=>t.path===active);

  const refresh = () => setFiles(listWorkspace());
  useEffect(() => {
    try {
      let current = listWorkspace();
      if (!current.length) { seedFiles.forEach(seed=>{ const f=createWorkspaceFile(seed.name); writeWorkspaceFile(f.path, seed.content); }); }
      refresh();
      const first = listWorkspace().find(f=>!f.isDirectory);
      if(first) openFile(first);
    } catch(e) { Alert.alert('Workspace error', String(e)); }
  }, []);
  const openFile = (file:WorkspaceFile) => {
    if(file.isDirectory) return;
    try {
      setTabs(old => old.some(t=>t.path===file.path) ? old : [...old,{name:file.name,path:file.path,content:readWorkspaceFile(file.path)}]);
      setActive(file.path);
    } catch(e) { Alert.alert('Could not open file', String(e)); }
  };
  const edit = (content:string) => setTabs(old=>old.map(t=>t.path===active?{...t,content,dirty:true}:t));
  const save = () => {
    if(!activeTab) return;
    try { writeWorkspaceFile(activeTab.path,activeTab.content); setTabs(old=>old.map(t=>t.path===active?{...t,dirty:false}:t)); setLogs(old=>[...old,`Saved ${activeTab.name}`]); }
    catch(e) { Alert.alert('Save failed',String(e)); }
  };
  const closeTab = (path:string) => {
    const idx=tabs.findIndex(t=>t.path===path), next=tabs.filter(t=>t.path!==path);
    setTabs(next); if(active===path) setActive(next[Math.max(0,idx-1)]?.path||'');
  };
  const create = () => {
    try {
      if(dialog==='file') { const f=createWorkspaceFile(name); refresh(); openFile({...f,isDirectory:false}); }
      else if(dialog==='folder') { createWorkspaceFolder(name); refresh(); }
      setName(''); setDialog(null); Keyboard.dismiss();
    } catch(e) { Alert.alert('Could not create item',String(e)); }
  };
  const run = () => {
    if(!activeTab) return;
    setTerminal(true);
    if(['js','jsx','ts','tsx'].includes(ext(activeTab.name))) {
      try { const output = new Function('console', activeTab.content)({log:(...args:unknown[])=>setLogs(old=>[...old,args.map(String).join(' ')])}); void output; }
      catch(e) { setLogs(old=>[...old,`Error: ${String(e)}`]); }
    } else setLogs(old=>[...old,`Run is available for JavaScript files. Open ${activeTab.name} to edit.`]);
  };

  return <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
    <View style={{height:52,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:14,borderBottomWidth:1,borderColor:C.line}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:10}}><Pressable onPress={()=>setExplorer(v=>!v)}><Ionicons name="menu" size={23} color={C.text}/></Pressable><Text style={{color:C.text,fontWeight:'700',fontSize:16}}>MH <Text style={{color:C.blue}}>Code</Text></Text></View>
      <View style={{flexDirection:'row',gap:18}}><Pressable onPress={save}><Ionicons name="save-outline" size={21} color={C.text}/></Pressable><Pressable onPress={run}><Ionicons name="play" size={20} color={C.green}/></Pressable><Pressable onPress={()=>setTerminal(v=>!v)}><Ionicons name="terminal-outline" size={21} color={C.text}/></Pressable></View>
    </View>
    <View style={{flex:1,flexDirection:'row'}}>
      {explorer && <View style={{width:190,backgroundColor:C.panel,borderRightWidth:1,borderColor:C.line}}>
        <View style={{height:42,paddingHorizontal:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{color:C.muted,fontSize:11,fontWeight:'700',letterSpacing:1}}>EXPLORER</Text><View style={{flexDirection:'row',gap:12}}><Pressable onPress={()=>{setName('');setDialog('file')}}><Ionicons name="document-outline" size={17} color={C.muted}/></Pressable><Pressable onPress={()=>{setName('');setDialog('folder')}}><Ionicons name="folder-outline" size={17} color={C.muted}/></Pressable></View></View>
        <Pressable onPress={refresh} style={{paddingHorizontal:12,paddingVertical:7}}><Text numberOfLines={1} style={{color:C.text,fontWeight:'700',fontSize:12}}>⌄  WORKSPACE</Text></Pressable>
        <ScrollView>{files.map(file=><Pressable key={file.path} onPress={()=>openFile(file)} style={{height:34,paddingLeft:22,paddingRight:8,flexDirection:'row',alignItems:'center',gap:8,backgroundColor:active===file.path?'#252a34':'transparent'}}><Ionicons name={icon(file) as any} size={15} color={file.isDirectory?'#d8b66d':C.blue}/><Text numberOfLines={1} style={{color:active===file.path?C.text:'#b9bec8',fontSize:12}}>{file.name}</Text></Pressable>)}</ScrollView>
      </View>}
      <View style={{flex:1}}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{height:41,borderBottomWidth:1,borderColor:C.line,flexGrow:0}} contentContainerStyle={{alignItems:'stretch'}}>{tabs.map(tab=><Pressable key={tab.path} onPress={()=>setActive(tab.path)} style={{minWidth:115,paddingHorizontal:10,flexDirection:'row',alignItems:'center',gap:7,borderRightWidth:1,borderColor:C.line,borderTopWidth:active===tab.path?2:0,borderTopColor:C.blue,backgroundColor:active===tab.path?'#191c22':'transparent'}}><Ionicons name={(ext(tab.name)==='py'?'logo-python':ext(tab.name)==='html'?'logo-html5':ext(tab.name)==='css'?'logo-css3':'code-slash') as any} size={14} color={C.blue}/><Text numberOfLines={1} style={{color:C.text,fontSize:12,flex:1}}>{tab.name}{tab.dirty?' •':''}</Text><Pressable onPress={()=>closeTab(tab.path)} hitSlop={8}><Ionicons name="close" size={15} color={C.muted}/></Pressable></Pressable>)}</ScrollView>
        {activeTab ? <EditorWebView key={activeTab.path} value={activeTab.content} language={ext(activeTab.name)} onChange={edit} onLog={line=>setLogs(old=>[...old,line])}/> : <View style={{flex:1,alignItems:'center',justifyContent:'center'}}><Ionicons name="code-slash" size={38} color="#3d4350"/><Text style={{color:C.muted,marginTop:10}}>Open a file to start editing</Text></View>}
      </View>
    </View>
    <View style={{height:24,backgroundColor:'#176dbe',paddingHorizontal:10,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{fontSize:10,color:'white'}}>⌁  Workspace</Text><Text style={{fontSize:10,color:'white'}}>{activeTab?`${ext(activeTab.name).toUpperCase()}  •  UTF-8`:''}</Text></View>
    {terminal && <View style={{height:190,backgroundColor:'#0d0f13',borderTopWidth:1,borderColor:C.line}}><View style={{height:36,paddingHorizontal:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderColor:C.line}}><Text style={{color:C.text,fontSize:11,fontWeight:'700',letterSpacing:1}}>OUTPUT</Text><Pressable onPress={()=>setTerminal(false)}><Ionicons name="chevron-down" size={19} color={C.muted}/></Pressable></View><ScrollView contentContainerStyle={{padding:11,gap:5}}>{logs.map((line,i)=><Text key={i} style={{fontFamily:'monospace',fontSize:11,color:line.startsWith('Error')?'#ff7777':C.muted}}>{`› ${line}`}</Text>)}</ScrollView></View>}
    <Modal transparent visible={!!dialog} animationType="fade" onRequestClose={()=>setDialog(null)}><Pressable onPress={()=>setDialog(null)} style={{flex:1,backgroundColor:'#0009',justifyContent:'center',padding:28}}><Pressable onPress={e=>e.stopPropagation()} style={{backgroundColor:C.panel,padding:18,borderRadius:12,borderColor:C.line,borderWidth:1}}><Text style={{color:C.text,fontWeight:'700',fontSize:16,marginBottom:14}}>New {dialog}</Text><TextInput value={name} onChangeText={setName} autoFocus placeholder={dialog==='file'?'example.js':'components'} placeholderTextColor={C.muted} style={{color:C.text,borderWidth:1,borderColor:C.line,borderRadius:8,paddingHorizontal:12,paddingVertical:10}} onSubmitEditing={create}/><View style={{flexDirection:'row',justifyContent:'flex-end',gap:18,marginTop:18}}><Pressable onPress={()=>setDialog(null)}><Text style={{color:C.muted}}>CANCEL</Text></Pressable><Pressable onPress={create}><Text style={{color:C.blue,fontWeight:'700'}}>CREATE</Text></Pressable></View></Pressable></Pressable></Modal>
  </SafeAreaView>;
}
