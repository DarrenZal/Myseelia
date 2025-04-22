const r=(e,t)=>{const a=e.searchParams.get(t);return e.searchParams.delete(t),history.replaceState(null,document.title,e.toString()),a};export{r as e};
