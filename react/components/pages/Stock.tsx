import { FlatList, SectionList, View } from "react-native"
import Header from "../Header"
import s from "../../assets/style"
import TopHeader from "../TopHeader"
import { useState, useEffect } from "react"
import Loader from "../Loader"
import PositionTile from "../PositionTile"
import HorizontalLine from "../HorizontalLine"
import BarText from "../BarText"
import { getPassword } from "../../helpers/Storage"
import { rqGet, rqPatch } from "../../helpers/SCFetch"
import { ACCENT_COLOR, API_SOUSCHEF_URL } from "../../assets/constants"
import { useIsFocused } from "@react-navigation/native"
import AmountIndicator from "../AmountIndicator"
import { SCButton, SCInput, SCModal } from "../SCSpecifics"
import { StockItem } from "../../types"
import { useToast } from "react-native-toast-notifications";
import { prepareDate } from "../../helpers/Prepare"

export default function Stock({navigation}){
  const isFocused = useIsFocused()
  const [stockFreezer, setStockFreezer] = useState([])
  const [stockCupboard, setStockCupboard] = useState([])
  const [loaderVisible, setLoaderVisible] = useState(true)
  const [stockEditor, setStockEditor] = useState(false)
  const [stockDrilldown, setStockDrilldown] = useState(false)
  const toast = useToast();

  const [iName, setIName] = useState("")
  const [stockDdDetails, setStockDdDetails] = useState([])

  // stock item parameters
  const [sId, setSId] = useState(0)
  const [sAmount, setSAmount] = useState(0)
  const [sExpirationDate, setSExpirationDate] = useState("")
  const [pUnit, setPUnit] = useState("")

  const getData = async () => {
    setLoaderVisible(true);

    const magic_word = await getPassword();
    rqGet(API_SOUSCHEF_URL + "stock/ingredient/0", {
      magic_word: magic_word,
    })
      .then(items => {
        const freezables = items.filter(ing => ing.freezable)
        setStockFreezer(freezables)
        setStockCupboard(items.filter(ing => !freezables.includes(ing)))
      })
      .catch(err => console.error(err))
      .finally(() => setLoaderVisible(false))
  }

  const drilldown = async (ing_id: number) => {
    const magic_word = await getPassword();
    rqGet(API_SOUSCHEF_URL + "stock/ingredient/" + ing_id, {
      magic_word: magic_word,
    })
      .then((items) => {
        setIName(items[0].product.ingredient.name)
        setStockDdDetails(items)
      })
      .catch(err => console.error(err))
      .finally(() => setStockDrilldown(true))
  }

  const editStock = async (stock_id: number, unit: string) => {
    const magic_word = await getPassword();
    rqGet(API_SOUSCHEF_URL + "stock/" + stock_id, {
      magic_word: magic_word,
    })
      .then((item: StockItem) => {
        setSId(item.id)
        setSAmount(item.amount)
        setSExpirationDate(item.expiration_date)
        setPUnit(unit)
      })
      .catch(err => console.error(err))
      .finally(() => setStockEditor(true))
  }
  const handleSubmit = async () => {
    const toastId = toast.show("Zapisuję...");

    const magic_word = await getPassword();
    rqPatch(API_SOUSCHEF_URL + "stock/" + sId, {
      magic_word: magic_word,
      amount: sAmount || 0,
      expirationDate: sExpirationDate,
    })
    .then(res => {
      toast.update(toastId, "Stan poprawiony", {type: "success"});
      getData();
    })
    .catch(err => {
      console.error(err)
      toast.update(toastId, `Nie udało się zapisać: ${err.message}`, {type: "danger"})
    })
    .finally(() => {
      setStockEditor(false);
      setStockDdDetails([]);
      setIName("");
      setStockDrilldown(false);
    })
  }

  useEffect(() => {
    if(isFocused) getData();
  }, [isFocused])

  interface ContentEl{
    header: string,
    icon: string,
    data: any[],
    emptyNotice: string,
  }
  const content: ContentEl[] = [
    {
      header: "Lodówka",
      icon: "cubes",
      data: stockFreezer,
      emptyNotice: "Lodówka pusta",
    },
    {
      header: "Szafka",
      icon: "cookie-bite",
      data: stockCupboard,
      emptyNotice: "Szafka pusta",
    },
  ]

  return <View style={s.wrapper}>
    <TopHeader title="Przeglądaj obecny stan swojej kuchni" />

    {loaderVisible
    ? <Loader />
    : <SectionList
      sections={content}
      renderSectionHeader={({section}) => <Header icon={section.icon} color={ACCENT_COLOR}>{section.header}</Header>}
      renderItem={({item}) => <PositionTile
              icon={item.category.symbol}
              title={item.name}
              buttons={<>
                <AmountIndicator amount={item.stock_items_sum_amount}
                  unit={item.unit}
                  minAmount={item.minimal_amount}
                  expirationDate={item.stock_items_min_expiration_date}
                  />
                <SCButton color="lightgray" onPress={() => drilldown(item.id)} small />
              </>}
          />
          }
      ItemSeparatorComponent={() => <HorizontalLine />}
      renderSectionFooter={({section}) => section.data.length === 0 &&
        <BarText color="lightgray">{section.emptyNotice}</BarText>
      }
    />}

    <SCModal
      visible={stockDrilldown}
      title={`${iName}: produkty`}
      onRequestClose={() => setStockDrilldown(false)}
      >
      <FlatList data={stockDdDetails}
        renderItem={({item}) => <PositionTile
          icon={item.product.ingredient.category.symbol}
          title={item.product.name}
          buttons={<>
            <AmountIndicator amount={item.amount}
              unit={item.product.ingredient.unit}
              maxAmount={item.product.amount}
              minAmount={item.product.ingredient.minimal_amount}
              expirationDate={item.expiration_date}
              />
            <SCButton icon="wrench" color="lightgray" onPress={() => editStock(item.id, item.product.ingredient.unit)} small />
          </>}
        />}
        ItemSeparatorComponent={() => <HorizontalLine />}
      />
      <View style={[s.flexRight, s.center]}>
        <SCButton icon="check" title="Zatwierdź" onPress={handleSubmit} />
      </View>
    </SCModal>

    <SCModal
      visible={stockEditor}
      title="Edytuj stan"
      onRequestClose={() => setStockEditor(false)}
      >
      <View style={[s.margin, s.center]}>
        <SCInput type="numeric" label={`Ilość (${pUnit})`} value={sAmount} onChange={setSAmount} />
        <SCInput type="date" label="Data przydatności" value={sExpirationDate} onChange={setSExpirationDate} />
      </View>
      <View style={[s.flexRight, s.center]}>
        <SCButton icon="check" title="Zatwierdź" onPress={handleSubmit} />
      </View>
    </SCModal>
  </View>
}
