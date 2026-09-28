const C=window.SUPERSBMART_CONFIG||{};
const hasConfig=C.SUPABASE_URL&&C.SUPABASE_ANON_KEY&&C.SUPABASE_URL.includes("supabase.co")&&!C.SUPABASE_ANON_KEY.includes("YOUR_");
const sb=hasConfig?supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY):null;
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const money=n=>"₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});
const demoProducts=[
{id:"demo1",name:"Classic T-Shirt",price:499,mrp:799,discount:38,category:"Men's Clothing",image:"https://placehold.co/500x500?text=T-Shirt"},
{id:"demo2",name:"Wireless Earbuds",price:999,mrp:1499,discount:33,category:"Electronics",image:"https://placehold.co/500x500?text=Earbuds"},
{id:"demo3",name:"Kitchen Storage Set",price:699,mrp:999,discount:30,category:"Home",image:"https://placehold.co/500x500?text=Home"}
];
let state={user:null,profile:null,cart:JSON.parse(localStorage.getItem("supersbmart_cart")||"[]")};

function saveCart(){localStorage.setItem("supersbmart_cart",JSON.stringify(state.cart));updateCartCount()}
function updateCartCount(){const n=state.cart.reduce((a,x)=>a+Number(x.qty||1),0);document.querySelectorAll(".cart-count").forEach(e=>e.textContent=n)}
function header(){
const admin=state.profile?.role==="admin";
$("#header").innerHTML=`<div class="top">Free delivery offers • Secure UPI payment</div><nav class="nav">
<a class="logo" href="${location.pathname.includes('/admin/')?'../':'index.html'}">🛍️ SUPERSBMART</a>
<form class="search" onsubmit="searchGo(event)"><input id="globalSearch" placeholder="Search products..."></form>
<div class="navlinks"><a href="${location.pathname.includes('/admin/')?'../':'index.html'}">Home</a><a href="${location.pathname.includes('/admin/')?'../categories.html':'categories.html'}">Categories</a>
<a href="${location.pathname.includes('/admin/')?'../offers.html':'offers.html'}">Offers</a><a href="${location.pathname.includes('/admin/')?'../cart.html':'cart.html'}">Cart (<b class="cart-count">0</b>)</a>
${state.user?`<a href="${location.pathname.includes('/admin/')?'../profile.html':'profile.html'}">Profile</a><button class="btn secondary" onclick="logout()">Logout</button>`:`<a href="${location.pathname.includes('/admin/')?'../login.html':'login.html'}">Login</a><a href="${location.pathname.includes('/admin/')?'../register.html':'register.html'}">Create Account</a>`}
${admin?`<a href="${location.pathname.includes('/admin/')?'index.html':'admin/index.html'}">Admin</a>`:""}</div></nav>`;
updateCartCount();
}
function footer(){if($("#footer"))$("#footer").innerHTML=`<footer class="footer"><b>SUPERSBMART</b><p>Original e-commerce platform with customer support and admin-controlled offers.</p><p>© 2026 SUPERSBMART</p></footer>`}
async function init(){
if(sb){const {data:{session}}=await sb.auth.getSession(); if(session){state.user=session.user;await loadProfile()}}
header();footer();renderPage();
}
async function loadProfile(){if(!sb||!state.user)return;const {data}=await sb.from("profiles").select("*").eq("id",state.user.id).maybeSingle();state.profile=data||null}
function searchGo(e){e.preventDefault();const q=$("#globalSearch").value.trim();location.href="products.html"+(q?"?q="+encodeURIComponent(q):"")}
async function logout(){if(sb)await sb.auth.signOut();state.user=null;state.profile=null;location.href="index.html"}
function requireLogin(){if(!state.user){alert("Please Create Account/Login before checkout.");location.href="login.html?next="+encodeURIComponent(location.href);return false}return true}
function productCard(p){return `<div class="card product"><a href="product.html?id=${encodeURIComponent(p.id)}"><img src="${esc(p.image||"https://placehold.co/500x500?text=SUPERSBMART")}" alt=""><h3>${esc(p.name)}</h3></a><div><span class="old">${money(p.mrp)}</span><span class="discount">${p.discount||0}% OFF</span></div><div class="price">${money(p.price)}</div><button class="btn" onclick='addCart(${JSON.stringify(p).replace(/'/g,"&#39;")})'>Add to Cart</button></div>`}
function addCart(p){const x=state.cart.find(i=>i.id===p.id);if(x)x.qty++;else state.cart.push({...p,qty:1});saveCart();alert("Added to cart");}
async function getProducts(){
if(!sb)return demoProducts;
let {data,error}=await sb.from("products").select("*").eq("active",true).order("created_at",{ascending:false});
return error?demoProducts:(data||[]);
}
async function renderPage(){
const page=document.body.dataset.page;
if(page==="home"){const ps=await getProducts();$("#homeProducts").innerHTML=ps.map(productCard).join("");$("#homeCategories").innerHTML=["Fashion","Men's Clothing","Women's Clothing","Kids","Electronics","Home","Beauty","Grocery"].map(x=>`<a class="card" href="products.html?category=${encodeURIComponent(x)}"><h3>${x}</h3><p>Shop now →</p></a>`).join("");$("#homeOffers").innerHTML=ps.slice(0,3).map(productCard).join("")}
if(page==="products"){const ps=await getProducts(),q=new URLSearchParams(location.search).get("q")||"",cat=new URLSearchParams(location.search).get("category")||"";const filtered=ps.filter(p=>(!q||p.name.toLowerCase().includes(q.toLowerCase()))&&(!cat||p.category===cat));$("#appContent").innerHTML=`<div class="row"><input id="min" placeholder="Min price"><input id="max" placeholder="Max price"><button class="btn" onclick="filterProducts()">Filter</button></div><div id="productsGrid" class="product-grid">${filtered.map(productCard).join("")||"<p>No products found.</p>"}</div>`}
if(page==="categories")$("#appContent").innerHTML=["Fashion","Men's Clothing","Women's Clothing","Kids","Electronics","Mobiles","Home Appliances","Home & Living","Beauty","Grocery","Sports","Accessories"].map(x=>`<a class="card" style="display:inline-block;margin:7px" href="products.html?category=${encodeURIComponent(x)}"><h3>${x}</h3><p>Explore →</p></a>`).join("");
if(page==="offers"){let offers=[];if(sb){const r=await sb.from("festival_offers").select("*").eq("active",true).lte("starts_at",new Date().toISOString()).gte("ends_at",new Date().toISOString()).order("priority",{ascending:false});offers=r.data||[]}$("#appContent").innerHTML=(offers.length?offers:[]).map(o=>`<div class="card"><h2>${esc(o.festival_name)}</h2><p>${esc(o.description||"Special festival offer")}</p><b>${o.discount_percent||0}% OFF</b><p>Valid until ${new Date(o.ends_at).toLocaleString("en-IN")}</p></div>`).join("")||"<div class='notice'>No active festival offer right now.</div>"}
if(page==="cart")renderCart();
if(page==="register")renderRegister();
if(page==="login")renderLogin();
if(page==="forgot")renderForgot();
if(page==="profile")renderProfile();
if(page==="addresses")renderAddresses();
if(page==="wishlist")renderWishlist();
if(page==="orders")renderOrders();
if(page==="checkout")renderCheckout();
if(page==="payment")renderPayment();
if(page==="product")renderProduct();
if(page==="support")renderSupport();
if(page==="returns")renderReturns();
if(page==="notifications")renderNotifications();
if(page?.startsWith("admin"))renderAdmin(page);
}
function renderRegister(){ $("#appContent").innerHTML=`<form class="form" onsubmit="register(event)"><h2>Create Account</h2><input name="name" placeholder="Full name" required><input name="email" type="email" placeholder="Email" required><input name="phone" placeholder="Mobile number"><input name="password" type="password" minlength="6" placeholder="Password" required><input name="confirm" type="password" minlength="6" placeholder="Confirm password" required><input name="address" placeholder="Delivery address"><input name="city" placeholder="City"><input name="state" placeholder="State"><input name="pincode" placeholder="Pincode"><button class="btn">Create Account</button><p>Already have an account? <a href="login.html">Login</a></p></form>`}
async function register(e){e.preventDefault();const f=new FormData(e.target);if(f.get("password")!==f.get("confirm"))return alert("Passwords do not match.");if(!sb)return alert("Supabase is not configured. Add config.js first.");const r=await sb.auth.signUp({email:f.get("email").trim(),password:f.get("password")});if(r.error)return alert(r.error.message);if(r.data.user){await sb.from("profiles").upsert({id:r.data.user.id,full_name:f.get("name").trim(),phone:f.get("phone"),email:f.get("email").trim()});if(f.get("address"))await sb.from("addresses").insert({user_id:r.data.user.id,address_line:f.get("address"),city:f.get("city"),state:f.get("state"),pincode:f.get("pincode"),is_default:true})}alert("Account created. Please verify email if Supabase requires it, then login.");location.href="login.html"}
function renderLogin(){ $("#appContent").innerHTML=`<form class="form" onsubmit="login(event)"><h2>Login</h2><input name="email" type="email" placeholder="Email" required><input name="password" type="password" placeholder="Password" required><button class="btn">Login</button><p><a href="forgot-password.html">Forgot Password?</a></p><p>New customer? <a href="register.html">Create Account</a></p></form>`}
async function login(e){e.preventDefault();if(!sb)return alert("Supabase is not configured. Add config.js first.");const f=new FormData(e.target);const r=await sb.auth.signInWithPassword({email:f.get("email").trim(),password:f.get("password")});if(r.error)return alert("Login failed: "+r.error.message);location.href="index.html"}
function renderForgot(){ $("#appContent").innerHTML=`<form class="form" onsubmit="forgot(event)"><h2>Reset Password</h2><input name="email" type="email" placeholder="Email" required><button class="btn">Send Reset Link</button></form>`}
async function forgot(e){e.preventDefault();if(!sb)return alert("Configure Supabase first.");const email=new FormData(e.target).get("email").trim();const r=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname.replace("forgot-password.html","")});alert(r.error?r.error.message:"Password reset email sent.")}
function renderCart(){const total=state.cart.reduce((a,x)=>a+x.price*x.qty,0),ship=total*.05,delivery=50,grand=total+ship+delivery;$("#appContent").innerHTML=state.cart.length?`<div>${state.cart.map((x,i)=>`<div class="card row" style="margin-bottom:10px"><img src="${x.image}" width="90" height="90"><div style="flex:1"><h3>${esc(x.name)}</h3><b>${money(x.price)}</b><div class="qty"><button onclick="changeQty(${i},-1)">−</button> ${x.qty} <button onclick="changeQty(${i},1)">+</button> <button class="btn danger" onclick="removeCart(${i})">Remove</button></div></div><b>${money(x.price*x.qty)}</b></div>`).join("")}</div><div class="panel"><p>Subtotal: ${money(total)}</p><p>Shipping (5%): ${money(ship)}</p><p>Delivery: ${money(delivery)}</p><h2>Total: ${money(grand)}</h2><button class="btn" onclick="goCheckout()">Proceed to Checkout</button></div>`:"<div class='notice'>Your cart is empty.</div>"}
function changeQty(i,d){state.cart[i].qty=Math.max(1,state.cart[i].qty+d);saveCart();renderCart()} function removeCart(i){state.cart.splice(i,1);saveCart();renderCart()} function goCheckout(){if(requireLogin())location.href="checkout.html"}
async function renderProduct(){const id=new URLSearchParams(location.search).get("id"),ps=await getProducts(),p=ps.find(x=>x.id===id)||ps[0];if(!p)return;$("#appContent").innerHTML=`<div class="card row"><img src="${p.image}" style="max-width:420px;width:100%;object-fit:cover"><div style="flex:1"><span class="badge">${p.discount||0}% OFF</span><h1>${esc(p.name)}</h1><p>${esc(p.category)}</p><div><span class="old">${money(p.mrp)}</span><span class="price">${money(p.price)}</span></div><p>Delivery available • Secure payment • Return policy as applicable</p><button class="btn" onclick='addCart(${JSON.stringify(p).replace(/'/g,"&#39;")})'>Add to Cart</button> <button class="btn secondary" onclick='addCart(${JSON.stringify(p).replace(/'/g,"&#39;")});location.href="cart.html"'>Buy Now</button></div></div>`}
function renderCheckout(){if(!requireLogin())return;const total=state.cart.reduce((a,x)=>a+x.price*x.qty,0),ship=total*.05,grand=total+ship+50;$("#appContent").innerHTML=`<div class="panel"><h2>Delivery & Order</h2><p>${state.profile?.full_name||state.user?.email}</p><p>Select/save your delivery address in Profile.</p><h3>Order Total: ${money(grand)}</h3><button class="btn" onclick="createOrder()">Continue to Payment</button></div>`}
async function createOrder(){if(!requireLogin()||!state.cart.length)return;const total=state.cart.reduce((a,x)=>a+x.price*x.qty,0),ship=total*.05,grand=total+ship+50;if(!sb)return alert("Configure Supabase first.");const r=await sb.from("orders").insert({user_id:state.user.id,subtotal:total,shipping_fee:ship,delivery_fee:50,total_amount:grand,payment_status:"pending",order_status:"pending"}).select().single();if(r.error)return alert(r.error.message);for(const x of state.cart)await sb.from("order_items").insert({order_id:r.data.id,product_id:String(x.id),product_name:x.name,quantity:x.qty,unit_price:x.price});state.cart=[];saveCart();location.href="payment.html?order="+r.data.id}
function renderPayment(){const id=new URLSearchParams(location.search).get("order");$("#appContent").innerHTML=`<div class="panel"><h2>UPI Payment</h2><p>Pay the displayed amount using the current SUPERSBMART UPI/QR details.</p><div class="notice">Admin controls UPI ID and QR code from Admin Settings.</div><form class="form" onsubmit="submitUTR(event)"><input name="utr" inputmode="numeric" placeholder="Enter UTR / transaction reference" required><input name="screenshot" type="url" placeholder="Payment screenshot URL (optional)"><input type="hidden" name="order" value="${esc(id||"")}"><button class="btn">Submit Payment</button></form></div>`}
async function submitUTR(e){e.preventDefault();if(!requireLogin()||!sb)return;const f=new FormData(e.target),id=f.get("order"),utr=f.get("utr").trim();if(!/^[0-9A-Za-z-]{6,40}$/.test(utr))return alert("Enter a valid transaction reference.");const r=await sb.from("payments").insert({order_id:id,user_id:state.user.id,utr,status:"pending",screenshot_url:f.get("screenshot")||null});if(r.error)return alert(r.error.message);await sb.from("orders").update({payment_status:"pending",order_status:"payment_verification"}).eq("id",id);alert("Payment submitted. It will remain pending until admin verification.");location.href="orders.html"}
async function renderOrders(){if(!requireLogin())return;let data=[];if(sb){const r=await sb.from("orders").select("*").eq("user_id",state.user.id).order("created_at",{ascending:false});data=r.data||[]}$("#appContent").innerHTML=data.length?`<table class="table"><tr><th>Order</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr>${data.map(o=>`<tr><td>${o.id}</td><td>${money(o.total_amount)}</td><td>${o.payment_status}</td><td>${o.order_status}</td><td>${new Date(o.created_at).toLocaleDateString("en-IN")}</td></tr>`).join("")}</table>`:"<div class='notice'>No orders yet.</div>"}
function renderProfile(){if(!requireLogin())return;$("#appContent").innerHTML=`<div class="panel"><h2>${esc(state.profile?.full_name||state.user.email)}</h2><p>${esc(state.user.email)}</p><div class="row"><a class="btn" href="orders.html">Order History</a><a class="btn secondary" href="addresses.html">Addresses</a><a class="btn secondary" href="wishlist.html">Wishlist</a><a class="btn secondary" href="customer-service.html">Customer Service</a></div></div>`}
async function renderAddresses(){if(!requireLogin())return;let a=[];if(sb){const r=await sb.from("addresses").select("*").eq("user_id",state.user.id);a=r.data||[]}$("#appContent").innerHTML=`<div class="row">${a.map(x=>`<div class="card"><b>${x.is_default?"Default Address":""}</b><p>${esc(x.address_line)}, ${esc(x.city)}, ${esc(x.state)} - ${esc(x.pincode)}</p></div>`).join("")}</div><form class="form" onsubmit="addAddress(event)"><h2>Add Address</h2><input name="address" placeholder="Address" required><input name="city" placeholder="City" required><input name="state" placeholder="State" required><input name="pincode" placeholder="Pincode" required><button class="btn">Save Address</button></form>`}
async function addAddress(e){e.preventDefault();if(!sb||!requireLogin())return;const f=new FormData(e.target);const r=await sb.from("addresses").insert({user_id:state.user.id,address_line:f.get("address"),city:f.get("city"),state:f.get("state"),pincode:f.get("pincode")});if(r.error)alert(r.error.message);else renderAddresses()}
function renderWishlist(){if(!requireLogin())return;$("#appContent").innerHTML="<div class='notice'>Wishlist is ready for Supabase-backed product saving. Add wishlist controls to product cards when wishlist table is enabled.</div>"}
async function renderSupport(){
if(!requireLogin())return;
if(!sb){$("#appContent").innerHTML="<div class='notice'>Supabase is not configured. Add config.js first.</div>";return}
const ordersRes=await sb.from("orders").select("id,created_at,total_amount,order_status,payment_status").eq("user_id",state.user.id).order("created_at",{ascending:false});
const orders=ordersRes.data||[];
const ticketsRes=await sb.from("support_tickets").select("*").eq("user_id",state.user.id).order("created_at",{ascending:false});
const tickets=ticketsRes.data||[];
let cards=[];
for(const t of tickets){
let attachment="";
if(t.attachment_path){
const sr=await sb.storage.from("support-files").createSignedUrl(t.attachment_path,3600);
if(sr.data?.signedUrl)attachment=`<p><a href="${esc(sr.data.signedUrl)}" target="_blank" rel="noopener">View attachment</a></p>`;
}
cards.push(`<div class="card" style="margin-top:12px"><h3>${esc(t.subject)}</h3><p><b>Category:</b> ${esc(t.category||"Other")} &nbsp; <b>Status:</b> ${esc(t.status)}</p><p>${esc(t.message)}</p>${attachment}${t.admin_reply?`<div class="panel"><b>Admin reply:</b><p>${esc(t.admin_reply)}</p></div>`:"<p class='notice'>Waiting for customer-service reply.</p>"}<small>${new Date(t.created_at).toLocaleString("en-IN")}</small></div>`);
}
$("#appContent").innerHTML=`<div class="panel"><h2>Customer Service</h2><p>Create a ticket for an order, payment, delivery, return/refund or account issue. You can attach an image/PDF.</p><form class="form" onsubmit="createTicket(event)"><input name="subject" placeholder="Subject" required><select name="category"><option>Order</option><option>Payment</option><option>Delivery</option><option>Return/Refund</option><option>Account</option><option>Other</option></select><select name="order_id"><option value="">No specific order</option>${orders.map(o=>`<option value="${o.id}">Order ${String(o.id).slice(0,8)} • ${money(o.total_amount)}</option>`).join("")}</select><textarea name="message" rows="6" placeholder="Describe your issue" required></textarea><label>Attachment (optional)<br><input name="attachment" type="file" accept="image/*,.pdf"></label><button class="btn">Create Ticket</button></form></div><div class="panel" style="margin-top:16px"><h2>My Support Tickets</h2>${cards.join("")||"<div class='notice'>No support tickets yet.</div>"}</div>`;
}
async function createTicket(e){
e.preventDefault();if(!sb||!requireLogin())return;
const f=new FormData(e.target), subject=String(f.get("subject")||"").trim(), message=String(f.get("message")||"").trim(), category=String(f.get("category")||"Other"), orderId=String(f.get("order_id")||"").trim()||null;
if(!subject||!message)return alert("Subject and message are required.");
let attachmentPath=null;const file=f.get("attachment");
if(file&&file.size){
if(!/^(image\/|application\/pdf$)/.test(file.type))return alert("Only image or PDF files are allowed.");
if(file.size>5*1024*1024)return alert("File size must be 5 MB or less.");
const safe=(file.name||"attachment").replace(/[^a-zA-Z0-9._-]/g,"_");
attachmentPath=`support/${state.user.id}/${Date.now()}-${safe}`;
const up=await sb.storage.from("support-files").upload(attachmentPath,file,{upsert:false,contentType:file.type});
if(up.error)return alert("Attachment upload failed: "+up.error.message);
}
const payload={user_id:state.user.id,subject,category,message,status:"open",attachment_path:attachmentPath};
if(orderId)payload.order_id=orderId;
const r=await sb.from("support_tickets").insert(payload);
if(r.error){if(attachmentPath)await sb.storage.from("support-files").remove([attachmentPath]);return alert("Ticket creation failed: "+r.error.message);}
alert("Support ticket created successfully.");await renderSupport();
}

function renderReturns(){if(!requireLogin())return;$("#appContent").innerHTML=`<div class="panel"><h2>Returns & Refunds</h2><p>Select an eligible delivered order from Order History and contact Customer Service to request a return/refund.</p></div>`}
function renderNotifications(){if(!requireLogin())return;$("#appContent").innerHTML="<div class='notice'>No new notifications.</div>"}
function renderAdmin(page){
if(!state.user||state.profile?.role!=="admin"){location.href="../login.html";return}
const titles={"admin":"Dashboard","admin-products":"Products","admin-orders":"Orders","admin-customers":"Customers","admin-payments":"Payments","admin-festivals":"Festival Discounts","admin-coupons":"Coupons","admin-banners":"Banners","admin-support":"Support","admin-settings":"Settings"};
if(page==="admin"){$("#appContent").innerHTML=`<div class="row"><div class="card stat"><h3>Products</h3><a href="products.html">Manage</a></div><div class="card stat"><h3>Orders</h3><a href="orders.html">Manage</a></div><div class="card stat"><h3>Festival Offers</h3><a href="festivals.html">Manage</a></div><div class="card stat"><h3>Support</h3><a href="support.html">Manage</a></div></div>`}
else if(page==="admin-festivals")$("#appContent").innerHTML=`<form class="form" onsubmit="addFestival(event)"><h2>Add Festival Offer</h2><input name="name" placeholder="Festival name" required><textarea name="description" placeholder="Offer description"></textarea><input name="discount" type="number" min="0" max="100" placeholder="Discount %"><input name="start" type="datetime-local" required><input name="end" type="datetime-local" required><input name="priority" type="number" value="0" placeholder="Priority"><button class="btn">Create Festival Offer</button></form><div id="festivalList"></div>`; 
else if(page==="admin-support")renderAdminSupport();else if(page==="admin-products")$("#appContent").innerHTML=`<form class="form" onsubmit="addProduct(event)"><h2>Add Product</h2><input name="name" placeholder="Product name" required><input name="category" placeholder="Category" required><input name="price" type="number" placeholder="Selling price" required><input name="mrp" type="number" placeholder="MRP" required><input name="discount" type="number" placeholder="Discount %"><input name="image" placeholder="Image URL"><input name="stock" type="number" placeholder="Stock"><button class="btn">Add Product</button></form>`;
else if(page==="admin-settings")$("#appContent").innerHTML=`<form class="form"><h2>Payment & Site Settings</h2><input placeholder="UPI ID" id="upi"><input placeholder="QR image URL" id="qr"><input placeholder="Customer care contact" id="care"><button type="button" class="btn" onclick="saveSettings()">Save Settings</button></form>`;
else $("#appContent").innerHTML=`<div class="panel"><h2>${titles[page]||"Admin"}</h2><p>Connect this module to the corresponding Supabase table. RLS protects customer data.</p></div>`;
}
async function renderAdminSupport(){
if(!sb)return;
const r=await sb.from("support_tickets").select("*").order("created_at",{ascending:false});
if(r.error){$("#appContent").innerHTML=`<div class="notice">${esc(r.error.message)}</div>`;return}
const tickets=r.data||[];let cards=[];
for(const t of tickets){
let attachment="";
if(t.attachment_path){const sr=await sb.storage.from("support-files").createSignedUrl(t.attachment_path,3600);if(sr.data?.signedUrl)attachment=`<p><a href="${esc(sr.data.signedUrl)}" target="_blank" rel="noopener">View attachment</a></p>`;}
cards.push(`<div class="card" style="margin-top:12px"><h3>${esc(t.subject)}</h3><p><b>Customer:</b> ${esc(String(t.user_id).slice(0,12))} &nbsp; <b>Category:</b> ${esc(t.category||"Other")}</p><p><b>Order:</b> ${esc(t.order_id||"Not linked")}</p><p>${esc(t.message)}</p>${attachment}<form onsubmit="updateSupportTicket(event,'${t.id}')" class="form"><select name="status">${["open","in_progress","waiting_customer","resolved","closed"].map(s=>`<option value="${s}" ${t.status===s?"selected":""}>${s.replaceAll("_"," ")}</option>`).join("")}</select><textarea name="reply" rows="4" placeholder="Admin reply">${esc(t.admin_reply||"")}</textarea><button class="btn">Save Reply & Status</button></form></div>`);
}
$("#appContent").innerHTML=`<div class="panel"><h2>Customer Support Tickets</h2><p>Reply to customers and update ticket status.</p>${cards.join("")||"<div class='notice'>No tickets yet.</div>"}</div>`;
}
async function updateSupportTicket(e,id){
e.preventDefault();if(!sb)return;const f=new FormData(e.target);
const r=await sb.from("support_tickets").update({status:String(f.get("status")),admin_reply:String(f.get("reply")||"").trim(),updated_at:new Date().toISOString()}).eq("id",id);
if(r.error)return alert("Update failed: "+r.error.message);
alert("Ticket updated.");await renderAdminSupport();
}

async function addProduct(e){e.preventDefault();if(!sb)return;const f=new FormData(e.target);const r=await sb.from("products").insert({name:f.get("name"),category:f.get("category"),price:Number(f.get("price")),mrp:Number(f.get("mrp")),discount_percent:Number(f.get("discount")||0),image_url:f.get("image"),stock:Number(f.get("stock")||0),active:true});if(r.error)alert(r.error.message);else{alert("Product added.");e.target.reset()}}
async function addFestival(e){e.preventDefault();if(!sb)return;const f=new FormData(e.target);const r=await sb.from("festival_offers").insert({festival_name:f.get("name"),description:f.get("description"),discount_percent:Number(f.get("discount")||0),starts_at:new Date(f.get("start")).toISOString(),ends_at:new Date(f.get("end")).toISOString(),priority:Number(f.get("priority")||0),active:true});if(r.error)alert(r.error.message);else{alert("Festival offer added.");e.target.reset()}}
async function saveSettings(){if(!sb)return alert("Configure Supabase first.");alert("Add/update site settings through the site_settings table after schema setup.")}
async function filterProducts(){const min=Number($("#min").value||0),max=Number($("#max").value||Infinity);const ps=await getProducts();$("#productsGrid").innerHTML=ps.filter(p=>p.price>=min&&p.price<=max).map(productCard).join("")}
init();


/* ===== SUPERSBMART PAYMENT SETTINGS / UPI + QR ===== */
(function () {
  const cfg = window.SUPERSBMART_CONFIG || {};
  if (!window.supabase || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;

  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  window.SUPERSBMART = window.SUPERSBMART || {};

  async function currentUser() {
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    return data.user;
  }

  async function requireAdmin() {
    const user = await currentUser();
    if (!user) throw new Error('Please login as admin.');
    const { data, error } = await client.from('profiles').select('role').eq('id', user.id).single();
    if (error) throw error;
    if (data.role !== 'admin') throw new Error('Admin access required.');
    return user;
  }

  async function getPublicPaymentSettings() {
    const { data, error } = await client
      .from('site_settings')
      .select('key,value')
      .in('key', ['upi_id','qr_url','payment_instructions','customer_care']);
    if (error) throw error;
    const out = {};
    (data || []).forEach(row => { out[row.key] = row.value ?? ''; });
    return out;
  }

  async function savePaymentSettings(settings) {
    await requireAdmin();
    const rows = Object.entries(settings).map(([key, value]) => ({
      key, value: String(value ?? ''), is_public: true, updated_at: new Date().toISOString()
    }));
    const { error } = await client.from('site_settings').upsert(rows, { onConflict: 'key' });
    if (error) throw error;
  }

  async function uploadPaymentQR(file) {
    await requireAdmin();
    if (!file) throw new Error('Select a QR image.');
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      throw new Error('QR must be PNG, JPG/JPEG, or WEBP.');
    }
    if (file.size > 5 * 1024 * 1024) throw new Error('QR image must be 5 MB or smaller.');

    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const path = 'payment/upi-qr-' + Date.now() + '.' + ext;

    const { error: uploadError } = await client.storage
      .from('site-assets')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) throw uploadError;

    const { data } = client.storage.from('site-assets').getPublicUrl(path);
    if (!data || !data.publicUrl) throw new Error('Could not create QR public URL.');
    return data.publicUrl;
  }

  window.SUPERSBMART.requireAdmin = requireAdmin;
  window.SUPERSBMART.getPublicPaymentSettings = getPublicPaymentSettings;
  window.SUPERSBMART.savePaymentSettings = savePaymentSettings;
  window.SUPERSBMART.uploadPaymentQR = uploadPaymentQR;
})();
