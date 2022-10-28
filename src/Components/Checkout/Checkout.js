import { useState, useContext } from "react"
import { CartContext } from "../../Context/CartContext"
import { getDocs, addDoc, collection, where, query, documentId, writeBatch } from 'firebase/firestore'
import { Oval } from  'react-loader-spinner'
import { db } from '../../services/firebase'
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import './Checkout.css'
import { ErrorResponse } from "@remix-run/router"


const Checkout = () =>{
    const [loading, setLoading] = useState(false)
    const {cart, total, clearCart} = useContext(CartContext)
    const MySwal = withReactContent(Swal)

    const [name, setName] = useState('')
    const [lastname, setLastname] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [email2, setEmail2] = useState('')

    const crearOrden = async (e) =>{
        e.preventDefault()
        if (name && email && phone && lastname && email2 !== ""){
            if(email === email2){
                setLoading(true)
        
        try{

        const objOrder = {
            buyer: {
                name: `${name}`,
                lastname: `${lastname}`,
                email: `${email}`,
                phone: `${phone}`,
            } ,
            items: cart,
            total
        }

        const ids = cart.map(prod => prod.id)
        const productsRef = collection(db, 'products')

        const productsAddedFromFirestore = await getDocs(query(productsRef, where(documentId(),'in', ids)))
        const { docs } = productsAddedFromFirestore

        const batch = writeBatch(db)
        const outOfStock = []

        docs.forEach(doc => {
            const dataDoc = doc.data()
            const stockDb = dataDoc.stock

            const productAddedToCart = cart.find(prod => prod.id === doc.id)
            const prodQuantity = productAddedToCart?.quantity 

            if(stockDb >= prodQuantity){
                batch.update(doc.ref, {stock: stockDb - prodQuantity})
            }else{
                outOfStock.push({id: doc.id, ...dataDoc})
            }
        })

        if(outOfStock.length === 0){
            await batch.commit()
            const orderRef = collection(db, 'orders')
            const orderAdded = await addDoc(orderRef, objOrder)
            Swal.fire(
                'Su orden se ha realizado con exito',
                `el id de su orden es ${orderAdded.id}`,
                'success'
            )
            clearCart()
            } else {
                Swal.fire(
                    'Hay productos que estan fuera de stock',
                    '',
                    'error'
                )
            }
        } catch (error){
            console.log(error)
        } finally{
            setLoading(false)
            setName("")
            setLastname("")
            setEmail("")
            setEmail2("")
            setPhone("")
        }
            } else {
                // Swal.fire(
                //     'Los correos no coinciden',
                //     '',
                //     'error'
                // )
                
            }
                } else  {
                    Swal.fire(
                    'Debe completar todos los campos',
                    '',
                    'error'
                )
            }
    }

    if(loading){
        return <div>
            <h1>Su orden se esta generando</h1>
            <div className='loading2'>
                <Oval 
                    height={80}
                    width={80}
                    color="#000000"
                    wrapperStyle={{}}
                    wrapperClass=""
                    visible={true}
                    ariaLabel='oval-loading'
                    secondaryColor="gray"
                    strokeWidth={2}
                    strokeWidthSecondary={2}/>
            </div>
        </div>
    }

    return(
        <div>
        <h5> Formulario de Contacto</h5>
        <form className='form'>
            <input
                type="text"
                name="name"
                placeholder="Nombre *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='formInput' 
                required/>
            <input
                type="text"
                name="lastname"
                placeholder="Apellido *"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                className='formInput' 
                required/>

            <input
                type="email"
                name="email"
                placeholder="Correo Electronico *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='formInput' 
                required/>
                {email !== email2 && <p className="errorForm">Los correos no coinciden</p>}
                <input
                type="email"
                name="email2"
                placeholder="Confirme Correo Electronico *"
                value={email2}
                onChange={(e) => setEmail2(e.target.value)}
                className='formInput' 
                required/>

                {email !== email2 && <p className="errorForm">Los correos no coinciden</p>}
            <input
                type="number"
                name="phone"
                placeholder="Telefono *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className='formInput' 
                required/>

            <input
                onClick={crearOrden}
                type='submit'
                value='Enviar'
                className='buttonOrder'/>

        </form>
    </div>
    )
}

export default Checkout