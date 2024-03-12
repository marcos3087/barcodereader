
import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Modal, Image, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [jdata, setData] = useState([]);
  const [result, setResult] = useState(null);
  const [isScanned, setIsScanned] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [logs, setLogs] = useState([]);
  const [corTxt, setCorTxt] = useState({ color: "#005546" })
  const [styleFundo, setStyleFundo] = useState({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00ff00',
  })
  const [corFundo, setCorFundo] = useState({ backgroundColor: "#FFFFFF", flex: 1 })

  // Pede ao usuario permissão de câmera.
  useEffect(() => {
    (async () => {

      const { status } = await Camera.requestCameraPermissionsAsync();

      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {

    // Carregar os dados do arquivo JSON remoto ao iniciar o aplicativo
    const loadData = async () => {
      try {
        //Pega os logs da memória para colocar no modal
        const logErro = await AsyncStorage.getItem("LogErro");
        if (logErro === null) {
          AsyncStorage.setItem("LogErro", "")
        }
        //Pega o json da memória
        const userId = await AsyncStorage.getItem('JsonData');

        //se não tem dados de json na memória, busca.
        if (userId === null) {
          const response = await fetch('https://meusite.com.br/jsonDados.json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          });

          const responseJson = await response.json();
          //salva o json na memoria.
          AsyncStorage.setItem('JsonData', JSON.stringify(responseJson));
          setData({ response: responseJson });

        } else {
          setData({ response: JSON.parse(userId) });
        }
      } catch (error) {
        // se deu erro, coloca na memória o log do erro.
        setData({ response: [] });
        let hora = getCurrentDateTime();
        await gravaLog(hora + ": Erro ao buscar lista \n")

      }


    };

    loadData();

  }, []);

  //aplica no async Storage o log 
  const gravaLog = async (newLog) => {
    let logant = await AsyncStorage.getItem("LogErro");
    if (logant === null) {
      logant = '';
    }
    await AsyncStorage.setItem("LogErro", logant + newLog)
  }
  //carrega da memória para o hook os logs ja existentes
  const loadLogs = async () => {
    try {
      const storedLogs = await AsyncStorage.getItem('LogErro');
      console.log(storedLogs)
      if (storedLogs !== null) {
        // Separar logs por linha
        const parsedLogs = storedLogs.split('\n');
        setLogs(parsedLogs.filter(log => log.trim() !== '')); // Filtrar linhas em branco
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  // Localiza no json o código de barras lido.
  const localiza = (data) => {
    retorno = false;

    jdata.response.map((it, i) => {

      let itbarcode = ("0000000" + it.barcode).slice(-7); // "0001"
      if (itbarcode == data) {
        retorno = it;
        return retorno;
      }
    })
    return retorno;
  }

  // para fechar a camera.
  const fechaCam = () => {
    setScanning(false);
  }

  // lê o código de barras e compara o valor lido ao json.
  // se existe, configura a tela para exibir os dados.
  // se não existe, apresenta a mensagem
  const handleBarCodeScanned = ({ type, data }) => {
    try {
      setScanning(false);
      // se não conseguiu ler, grava o log
      if (data === null || data === "") {
        let hora = getCurrentDateTime()
        gravaLog(hora + ": Nenhum código lido! \n")
      }
      //busca no json o valor lido
      const foundItem = localiza(data);

      setResult('Não encontrado');
      // se achou aplica os valores nas variáveis para exibição na tela
      if (foundItem) {
        const { nomcli, cpf, telefone } = foundItem;
        setStyleFundo({
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#279940',
        })
        setCorTxt({ color: "#005546" })
        setResult(`Autorizado\nNome: ${nomcli}\nCPF: ${cpf}\nTelefone: ${telefone}`);
      } else {
        setResult('Não encontrado');
        setCorTxt({ color: "#FFFFFF" })
        setStyleFundo({
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#A01525',
        })
      }
    } catch (error) {
      // se não conseguiu. grava o log
      gravaLog(" Erro ao ler codigo:" + error + "\n");
    }
  };
  // para abrir o modal de erro
  const handleOpenModal = () => {
    loadLogs();
    setModalVisible(true)

  }
  // para abrir a câmera para outra leitura
  const handleScanAgain = () => {
    setScanning(true);
    setResult(null);
  };
  // fecha o modal
  const handleCloseModal = () => {
    setModalVisible(false);
  };
  // carrega a data e hora do momento para montagem do log
  const getCurrentDateTime = () => {
    const currentDate = new Date();
    const currentDateTimeString = currentDate.toLocaleString(); // Obtém data e hora local formatada
    return currentDateTimeString;
  };

  // se não tem permissao da câmera o app não vai funcionar
  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>Acesso à câmera negado</Text>;
  }

  return (
    <View style={corFundo}>

      {scanning ? (
        //abre a camera configurada para ler barcode e qrCode
        <Camera
          key={isScanned ? 1 : 2}
          onBarCodeScanned={(result) => {
            handleBarCodeScanned(result);
            setIsScanned(!isScanned);
          }}
          barCodeScannerSettings={{
            barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr, BarCodeScanner.Constants.BarCodeType.code128, BarCodeScanner.Constants.BarCodeType.code39]
          }}
          style={{ flex: 1 }}
          type={Camera.Constants.Type.back}

        />

      ) : (
        <View style={[{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }]}>
          <View style={styles.contentImg}>
            <Image source={require('./assets/icone1.png')} style={styles.image} />
          </View>
          {result ? (
            <View style={styleFundo}>
              <Text style={[styles.resultText, corTxt]}>{result}</Text>
              <Button title="Escanear Novamente" onPress={handleScanAgain} />
            </View>
          ) : (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
            }}>
              <Button title="Validar Ingresso" onPress={() => setScanning(true)} />
            </View>
          )}
        </View>
      )}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Logs de Erro:</Text>
            <TouchableOpacity
              style={{ ...styles.openButton, backgroundColor: '#2196F3' }}
              onPress={handleCloseModal}
            >
              <Text style={styles.textStyle}>Fechar</Text>
            </TouchableOpacity>
            {logs.map((log, index) => (
              <Text key={index}>{log}</Text>
            ))}
          </View>
        </View>
      </Modal>
      <TouchableOpacity style={styles.iconContainer} onPress={() => { handleOpenModal() }}>
        <AntDesign name="codesquareo" size={24} color="black" />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.backcontainer, scanning ? { display: 'flex' } : { display: 'none' }]} onPress={() => { fechaCam() }}>
        <AntDesign name="back" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  result: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00ff00',
  },
  resultText: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  contentImg: {
    backgroundColor: 'rgba(0,0,0,0)',
    paddingTop: 80,
    justifyContent: "center",
    alignItems: "center"
  },
  image: {
    backgroundColor: 'rgba(0,0,0,0)',
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  iconContainer: {
    position: 'absolute',
    top: 40,
    right: 30,
  },
  backcontainer: {
    position: 'absolute',
    top: 40,
    left: 30,
  },
});
