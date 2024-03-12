# barcodereader
Leitor de código de barras

App em react-native/expo criado para ler código de barras e localizar os dados lidos em um Json disponível na web.

Libs utilizadas
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

Ao abrir, ele carrega o json no AsyncStorage e para cada código de barras lido, compara com os dados e localiza os dados.

por padrão, o Json deve ter o seguinte formato
<code>
[
    {
     "barcode": "1234",
     "nomcli": "ZÉ DA MANGA",
     "cpf": 12345678910,
     "telefone": "(35) 91234-5678"
    },
    ...
    // quantos itens desejar
]
</code>

O APP lê o barcode, tenta localizar e apresenta:
  * Tela verde com os dados encontrados
  * Tela vermelha com mensagem "Não encontrado"

