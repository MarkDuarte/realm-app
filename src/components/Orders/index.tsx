import React, { useState, useCallback } from 'react';
import { Alert, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'

import { Load } from '../Load';
import { Filters } from '../Filters';
import { Order, OrderProps } from '../Order';

import { Container, Header, Title, Counter } from './styles';
import { getRealm } from '../../database/realm';

export function Orders() {
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<OrderProps[]>([]);
  const [status, setStatus] = useState('open');

  async function fetchOrders() {
    setIsLoading(true);
    const realm = await getRealm();

    try {
      const response = realm
      .objects("Order")
      .filtered(`status = '${status}'`)
      .sorted("created_at")
      .toJSON()

      setOrders(response)
    } catch {
      Alert.alert("Error", "Não foi possível carregar os chamados.");
    } finally {
      realm.close();
      setIsLoading(false);
    }
  }

  async function OrderUpdate(id: string) {
    const realm = await getRealm()

    try {
      const orderSelected = realm
      .objects<OrderProps>("Order")
      .filtered(`_id = '${id}'`)[0]

      realm.write(() => {
        orderSelected.status = orderSelected.status === "open" ? "closed" : "open"
      })

      Alert.alert("Chamado", "Chamado atualizado!")
      fetchOrders()
    } catch {
      Alert.alert("Chamado", "Não foi possível atualizar o chamado!")
    }
  }

  async function handleOrderUpdate(id: string) {
    Alert.alert(
      "Chamado",
      "Encerrar o chamado!",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Confirmar",
          onPress: () => OrderUpdate(id)
        }
      ]
    )
  }

  useFocusEffect( useCallback(() => {
    fetchOrders();
  }, [status]))

  return (
    <Container>
      <Filters onFilter={setStatus} />

      <Header>
        <Title>Chamados {status === 'open' ? 'aberto' : 'encerrado'}</Title>
        <Counter>{orders.length}</Counter>
      </Header>

      {
        isLoading ?
          <Load />
          : <FlatList
            data={orders}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <Order data={item} onPress={() => handleOrderUpdate(item._id)} />
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
          />
      }
    </Container>
  );
}