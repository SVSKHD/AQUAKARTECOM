import AquaAlert from "@/components/reusables/toast"
import {useDispatch , useSelector} from "react-redux"




const useProduct = () =>{
  const dispatch = useDispatch()
const {cartData , favData} = useSelector((state)=>({...state}))


const AddToCart = (productData, setCartAdd) => {
  const isProductInCart = cartData.some(
    (item) => item._id === productData?._id,
  );

  if (!isProductInCart) {
    dispatch({
      type: 'ADD_TO_CART',
      payload: { ...productData, quantity: 1 },
    });

    dispatch({
      type: 'SHOW_NOTIFICATION',
      payload: { message: 'Successfully Added to Cart', messageType: 'success' },
    });
    setCartAdd(true);
  } else {
    dispatch({
      type: 'REMOVE_FROM_CART',
      payload: productData?._id,
    });

    dispatch({
      type: 'SHOW_NOTIFICATION',
      payload: { message: 'Successfully removed from cart', messageType: 'info' },
    });
    setCartAdd(false);
  }
};
const RemoveFromCart = () =>{


}

const UpdateCart = () =>{

}

const AddToFav = () =>{

}

const RemoveFromFav = () =>{


}

return {
  AddToCart,
  RemoveFromCart,
  UpdateCart,
  AddToFav,
  RemoveFromFav,
  }
}





export default useProduct