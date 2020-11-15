const runMainFromFirstFoundScript=async(requirePaths)=>{
  for(const id of requirePaths){
    try{
      require.resolve(id)
    }catch{
      continue
    }

    try{
    await require(id).main()
    }finally{
      break
    }
  }
}

module.exports={runMainFromFirstFoundScript}